/**
 * 并发控制工具
 * - 乐观锁检查
 * - 事务封装
 * - 幂等处理
 * - AI额度原子扣减
 */
import { getDb } from '@/lib/db';
import type Database from 'better-sqlite3';

/**
 * 乐观锁更新
 * @returns 更新成功返回true，版本冲突返回false
 */
export function optimisticUpdate(
  table: string,
  id: number,
  version: number,
  updates: Record<string, unknown>
): { success: boolean; newVersion?: number; error?: string } {
  const db = getDb();
  
  // 构建SET子句
  const setClauses: string[] = [];
  const values: unknown[] = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (key !== 'version' && key !== 'id') {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  setClauses.push('version = version + 1');
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  
  values.push(id);
  values.push(version);
  
  const sql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ? AND version = ?`;
  
  try {
    const result = db.prepare(sql).run(...values);
    if (result.changes === 0) {
      // 检查是记录不存在还是版本冲突
      const exists = db.prepare(`SELECT id, version FROM ${table} WHERE id = ?`).get(id);
      if (!exists) {
        return { success: false, error: '记录不存在' };
      }
      return { success: false, error: '内容已被其他人修改，请刷新后再编辑。' };
    }
    // 获取新版本号
    const updated = db.prepare(`SELECT version FROM ${table} WHERE id = ?`).get(id) as Record<string, unknown>;
    return { success: true, newVersion: updated?.version as number };
  } catch (error) {
    return { success: false, error: `更新失败: ${error}` };
  }
}

/**
 * 在事务中执行多个操作
 */
export function runTransaction<T>(fn: (db: Database.Database) => T): T {
  const db = getDb();
  const transaction = db.transaction(fn);
  return transaction(db);
}

/**
 * 幂等封禁用户
 * 已封禁则直接返回成功（不重复操作）
 */
export function idempotentBan(
  userId: number,
  reason: string,
  adminId: number,
  ip: string
): { success: boolean; alreadyBanned?: boolean; message: string } {
  const db = getDb();
  
  const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!user) {
    return { success: false, message: '用户不存在' };
  }
  
  // 幂等：已封禁直接返回成功
  if (user.status === 'banned') {
    return { success: true, alreadyBanned: true, message: '用户已被封禁' };
  }
  
  // 在事务中执行封禁操作
  const transaction = db.transaction(() => {
    db.prepare('UPDATE users SET status = ?, ban_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('banned', reason, userId);
    
    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)')
      .run(adminId, 'ban', 'user', userId, `封禁用户: ${reason}`, ip);
  });
  
  transaction();
  return { success: true, message: '用户已封禁' };
}

/**
 * 幂等解封用户
 * 已解封则直接返回成功
 */
export function idempotentUnban(
  userId: number,
  adminId: number,
  ip: string
): { success: boolean; alreadyActive?: boolean; message: string } {
  const db = getDb();
  
  const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!user) {
    return { success: false, message: '用户不存在' };
  }
  
  // 幂等：已解封直接返回成功
  if (user.status === 'active') {
    return { success: true, alreadyActive: true, message: '用户已处于正常状态' };
  }
  
  const transaction = db.transaction(() => {
    db.prepare('UPDATE users SET status = ?, ban_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('active', '', userId);
    
    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)')
      .run(adminId, 'unban', 'user', userId, '解封用户', ip);
  });
  
  transaction();
  return { success: true, message: '用户已解封' };
}

/**
 * AI额度原子扣减
 * 使用数据库原子操作，避免并发超扣
 * @returns { success: boolean, remaining?: number }
 */
export function atomicDecrementAiQuota(
  userId: number
): { success: boolean; remaining?: number; error?: string } {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  
  // 获取用户每日限额
  const user = db.prepare('SELECT ai_daily_limit FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!user) {
    return { success: false, error: '用户不存在' };
  }
  
  const dailyLimit = (user.ai_daily_limit as number) || 10;
  
  // 确保今日额度记录存在
  db.prepare('INSERT OR IGNORE INTO user_ai_quota (user_id, date, used_count, daily_limit) VALUES (?, ?, 0, ?)')
    .run(userId, today, dailyLimit);
  
  // 原子扣减：只有当 used_count < daily_limit 时才更新
  const result = db.prepare(
    'UPDATE user_ai_quota SET used_count = used_count + 1 WHERE user_id = ? AND date = ? AND used_count < daily_limit'
  ).run(userId, today);
  
  if (result.changes === 0) {
    // 额度不足
    const quota = db.prepare('SELECT used_count, daily_limit FROM user_ai_quota WHERE user_id = ? AND date = ?')
      .get(userId, today) as Record<string, unknown>;
    return {
      success: false,
      error: `今日AI调用次数已用完（${quota?.used_count}/${quota?.daily_limit}）`,
    };
  }
  
  // 获取剩余额度
  const quota = db.prepare('SELECT used_count, daily_limit FROM user_ai_quota WHERE user_id = ? AND date = ?')
    .get(userId, today) as Record<string, unknown>;
  
  return {
    success: true,
    remaining: (quota?.daily_limit as number) - (quota?.used_count as number),
  };
}

/**
 * 幂等收藏
 * 已收藏则直接返回成功
 */
export function idempotentFavorite(
  userId: number,
  targetType: string,
  targetId: number
): { success: boolean; alreadyFavorited?: boolean; favoriteId?: number; message: string } {
  const db = getDb();
  
  // 检查是否已收藏
  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?')
    .get(userId, targetType, targetId) as Record<string, unknown> | undefined;
  
  if (existing) {
    return { success: true, alreadyFavorited: true, favoriteId: existing.id as number, message: '已收藏' };
  }
  
  try {
    const result = db.prepare('INSERT INTO favorites (user_id, target_type, target_id) VALUES (?, ?, ?)')
      .run(userId, targetType, targetId);
    return { success: true, favoriteId: result.lastInsertRowid as number, message: '收藏成功' };
  } catch (error: unknown) {
    // 唯一约束冲突（并发情况）
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return { success: true, alreadyFavorited: true, message: '已收藏' };
    }
    return { success: false, message: '收藏失败' };
  }
}

/**
 * 幂等取消收藏
 */
export function idempotentUnfavorite(
  userId: number,
  targetType: string,
  targetId: number
): { success: boolean; message: string } {
  const db = getDb();
  
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?')
    .run(userId, targetType, targetId);
  
  return { success: true, message: '取消收藏成功' };
}

/**
 * 幂等点赞
 */
export function idempotentLike(
  userId: number,
  targetType: string,
  targetId: number
): { success: boolean; alreadyLiked?: boolean; likeId?: number; message: string } {
  const db = getDb();
  
  const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?')
    .get(userId, targetType, targetId) as Record<string, unknown> | undefined;
  
  if (existing) {
    return { success: true, alreadyLiked: true, likeId: existing.id as number, message: '已点赞' };
  }
  
  try {
    const result = db.prepare('INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)')
      .run(userId, targetType, targetId);
    return { success: true, likeId: result.lastInsertRowid as number, message: '点赞成功' };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return { success: true, alreadyLiked: true, message: '已点赞' };
    }
    return { success: false, message: '点赞失败' };
  }
}

/**
 * 幂等取消点赞
 */
export function idempotentUnlike(
  userId: number,
  targetType: string,
  targetId: number
): { success: boolean; message: string } {
  const db = getDb();
  
  db.prepare('DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?')
    .run(userId, targetType, targetId);
  
  return { success: true, message: '取消点赞成功' };
}
