# 后台系统全面改造 TASK

项目: /opt/xhblogs/ (Next.js 15 + React 19 + Tailwind 4 + better-sqlite3)
工作流: 修改代码 → npm run build → pm2 restart xhblogs

## ⚠️ 核心约束
- 不要动前台页面（app/page.tsx, app/posts/*, app/timeline/* 等非 admin 页面）
- 不要动 components/Navbar.tsx, ProfileCard.tsx, CloudPlayer.tsx 等前台组件
- 只改 app/admin/*, app/api/admin/*, lib/* 相关文件
- 每次改完必须 `cd /opt/xhblogs && npm run build` 验证
- 构建失败必须修复后再继续
- typescript.ignoreBuildErrors 保持 true（node_modules 类型问题是预存的）

---

## Phase 1: 安全基础（最优先）

### 1.1 环境变量与密钥
**文件**: lib/auth/utils.ts
- JWT_SECRET 必须来自 `process.env.JWT_SECRET`
- 生产环境（NODE_ENV=production）缺失时 throw Error，不允许 fallback 默认值
- 开发环境可使用默认值 'dev-secret-key'

**文件**: lib/db/index.ts
- 删除 `admin/admin123` 自动创建逻辑（第202-207行的 seed admin 代码）
- 管理员必须通过 ADMIN_USERNAME + ADMIN_PASSWORD 环境变量初始化
- 缺失时跳过 seed，不创建默认账号

**创建**: .env.example（参考模板）
```
JWT_SECRET=your-secret-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
```

### 1.2 登录安全加固
**文件**: app/api/admin/login/route.ts
- 增加登录失败计数：用内存 Map 或 DB 表记录 IP 失败次数
- 同一 IP 5分钟内失败5次 → 返回 429
- 同一账号连续失败10次 → 锁定30分钟
- 登录成功记录到 login_logs 表（账号、IP、User-Agent、时间）
- Cookie 加 Secure 标志（生产环境）

**新建表**: login_logs（在 lib/db/index.ts initTables 中添加）
```sql
CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  ip TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  success INTEGER DEFAULT 0,
  fail_reason TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 withAdminAuth 中间件
**新建**: lib/auth/with-admin-auth.ts
- 封装 getAdminFromRequest 的检查逻辑
- 返回统一格式的 401 响应
- 所有 app/api/admin/* 路由使用此中间件

---

## Phase 2: 数据库补全

### 2.1 补全表结构
**文件**: lib/db/index.ts initTables()

需确认以下表存在（CREATE TABLE IF NOT EXISTS）：
- users（已有？检查确认）
- login_logs（新建）
- operation_logs（已有，检查字段完整性）
- roles（新建）
- permissions（新建）
- ai_usage_logs（新建）

users 表结构：
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'banned', 'disabled')),
  daily_ai_limit INTEGER DEFAULT 10,
  login_count INTEGER DEFAULT 0,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INTEGER DEFAULT 1
);
```

ai_usage_logs 表：
```sql
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  model TEXT DEFAULT '',
  prompt TEXT DEFAULT '',
  response TEXT DEFAULT '',
  tokens_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.2 确认 blogs 表有 status 字段
- 已有 status CHECK('draft','published')
- 需要扩展为 CHECK('draft','published','hidden','deleted')
- 如果现有 CHECK 约束不包含 hidden/deleted，用迁移方式添加

---

## Phase 3: API 统一规范

### 3.1 统一响应格式
**新建**: lib/api/response.ts
```typescript
export function success(data: any, message = 'ok') {
  return NextResponse.json({ success: true, data, message });
}
export function error(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
```

### 3.2 withErrorHandler
**新建**: lib/api/with-error-handler.ts
- 包装 API route handler，catch 所有异常
- 返回统一错误格式

### 3.3 参数校验
**安装**: npm install zod
**新建**: lib/api/validators.ts
- 博客创建/更新 schema
- 用户创建/更新 schema
- 音乐/图片/项目/友链 CRUD schema

### 3.4 操作日志
- 所有 POST/PUT/DELETE admin 操作写入 operation_logs
- 封装 logOperation(adminId, action, targetType, targetId, detail, ip)

---

## Phase 4: 后台页面改造

### 4.1 统一组件
确认以下组件存在并可用：
- components/LoadingState.tsx ✅（已创建）
- components/ErrorState.tsx ✅（已创建）
- components/EmptyState.tsx ✅（已创建）
- **新建**: components/admin/Toast.tsx（全局提示）
- **新建**: components/admin/ConfirmDialog.tsx（二次确认弹窗）
- **新建**: components/admin/Pagination.tsx（分页组件）
- **新建**: components/admin/SearchBar.tsx（搜索组件）
- **新建**: components/admin/BatchActions.tsx（批量操作栏）

### 4.2 改造后台列表页
对以下页面进行改造（每个页面必须）：
1. fetch 用 try/catch/finally
2. 检查 res.ok
3. 失败显示 ErrorState + 重试按钮
4. 空数据显示 EmptyState
5. 支持搜索
6. 删除操作二次确认

需改造的页面：
- app/admin/blogs/page.tsx
- app/admin/images/page.tsx
- app/admin/music/page.tsx
- app/admin/users/page.tsx
- app/admin/comments/page.tsx
- app/admin/projects/page.tsx
- app/admin/friends/page.tsx
- app/admin/tags/page.tsx
- app/admin/logs/page.tsx

### 4.3 博客管理增强
- app/admin/blogs/BlogForm.tsx: slug 非空校验、唯一性校验
- 支持草稿/发布/隐藏/回收站状态切换
- app/admin/blogs/page.tsx: 状态筛选 tab

---

## Phase 5: 文件上传抽象

### 5.1 Storage Service
**新建**: lib/storage/index.ts
```typescript
export interface StorageProvider {
  upload(file: Buffer, key: string, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

export class LocalStorage implements StorageProvider { ... }
// 后续可实现 R2Storage, OSSStorage
```

### 5.2 上传 API 改造
**文件**: app/api/admin/media/upload/route.ts
- 校验文件大小（max 10MB）
- 校验文件类型（jpg/png/gif/webp/avif）
- 记录 width, height, size, mime_type 到 media_files 表
- 返回统一格式

---

## Phase 6: 构建验证

完成所有改造后：
1. `cd /opt/xhblogs && rm -rf .next && npm run build`
2. 修复所有构建错误
3. `pm2 restart xhblogs`
4. 验证：curl 登录接口、博客列表接口、用户列表接口

---

## 执行顺序
1. Phase 1（安全）→ 构建验证
2. Phase 2（数据库）→ 构建验证
3. Phase 3（API 规范）→ 构建验证
4. Phase 4（后台页面）→ 构建验证
5. Phase 5（文件上传）→ 构建验证
6. Phase 6（最终验证）

每个 Phase 完成后必须 npm run build 通过再继续下一个。
