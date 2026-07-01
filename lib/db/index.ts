import Database from 'better-sqlite3';
import path from 'path';
import bcryptjs from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'ayuu.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.pragma('busy_timeout = 5000');
    db.pragma('foreign_keys = ON');
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      category TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'hidden', 'deleted')),
      view_count INTEGER DEFAULT 0,
      seo_title TEXT DEFAULT '',
      seo_description TEXT DEFAULT '',
      og_image TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS media_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_type TEXT DEFAULT 'image' CHECK(file_type IN ('image', 'audio', 'video', 'document')),
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      mime_type TEXT DEFAULT '',
      usage_type TEXT DEFAULT 'other' CHECK(usage_type IN ('home_background', 'blog_cover', 'gallery', 'avatar', 'about', 'other')),
      alt_text TEXT DEFAULT '',
      user_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS music (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT DEFAULT '',
      url TEXT NOT NULL,
      cover_image TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_background INTEGER DEFAULT 0,
      is_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key TEXT UNIQUE NOT NULL,
      config_value TEXT DEFAULT '',
      description TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT DEFAULT '',
      target_id INTEGER,
      detail TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );

    CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
    CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
    CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
    CREATE INDEX IF NOT EXISTS idx_music_enabled ON music(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_admin ON operation_logs(admin_id);
    CREATE INDEX IF NOT EXISTS idx_site_config_key ON site_config(config_key);

    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL DEFAULT '',
      ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      success INTEGER DEFAULT 0,
      fail_reason TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_login_logs_username ON login_logs(username);
    CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON login_logs(ip);
    CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at);

    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      model TEXT DEFAULT '',
      prompt TEXT DEFAULT '',
      response_preview TEXT DEFAULT '',
      tokens_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at);
  `);

  // ---- 并发控制：version 字段 ----
  // 为 blogs, site_config, music, media_files 添加 version 列（如果不存在）

  // ---- 新表：用户 ----
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nickname TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    signature TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ban_reason TEXT DEFAULT '',
    admin_remark TEXT DEFAULT '',
    ai_daily_limit INTEGER DEFAULT 10,
    must_change_password INTEGER DEFAULT 0,
    last_login_at DATETIME,
    role TEXT DEFAULT 'user',
    email_verified INTEGER DEFAULT 0
  )`);

  try { db.exec('ALTER TABLE blogs ADD COLUMN version INTEGER DEFAULT 1'); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (blogs.version):', e); } }
  try { db.exec('ALTER TABLE blogs ADD COLUMN seo_title TEXT DEFAULT \'\''); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (blogs.seo_title):', e); } }
  try { db.exec('ALTER TABLE blogs ADD COLUMN seo_description TEXT DEFAULT \'\''); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (blogs.seo_description):', e); } }
  try { db.exec('ALTER TABLE blogs ADD COLUMN og_image TEXT DEFAULT \'\''); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (blogs.og_image):', e); } }
  try { db.exec('ALTER TABLE site_config ADD COLUMN version INTEGER DEFAULT 1'); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (site_config.version):', e); } }
  try { db.exec('ALTER TABLE music ADD COLUMN version INTEGER DEFAULT 1'); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (music.version):', e); } }
  try { db.exec('ALTER TABLE media_files ADD COLUMN version INTEGER DEFAULT 1'); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (media_files.version):', e); } }
  try { db.exec('ALTER TABLE users ADD COLUMN version INTEGER DEFAULT 1'); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (users.version):', e); } }
  try { db.exec('ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0'); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (users.login_count):', e); } }
  try { db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0'); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (users.email_verified):', e); } }

  // ---- 新表：收藏 ----
  db.exec("CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'music', 'media')), target_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, target_type, target_id), FOREIGN KEY (user_id) REFERENCES users(id))");
  db.exec("CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_favorites_target ON favorites(target_type, target_id)");

  // ---- 新表：点赞 ----
  db.exec("CREATE TABLE IF NOT EXISTS likes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'music', 'media')), target_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, target_type, target_id), FOREIGN KEY (user_id) REFERENCES users(id))");
  db.exec("CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id)");

  // ---- 新表：评论（扩展支持 music/friend/project） ----
  // 先检查旧表是否存在且缺少新字段，做迁移
  const commentsTableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='comments'").get() as Record<string, unknown> | undefined;
  if (commentsTableInfo) {
    const cols = db.prepare("PRAGMA table_info(comments)").all() as Record<string, unknown>[];
    const colNames = cols.map((c: Record<string, unknown>) => c.name as string);
    if (!colNames.includes('parent_id')) {
      db.exec("ALTER TABLE comments RENAME TO comments_old");
      db.exec("CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'media', 'music', 'friend', 'project')), target_id INTEGER NOT NULL, content TEXT NOT NULL, parent_id INTEGER DEFAULT NULL, status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))");
      // 动态检查旧表列，避免列数不匹配导致数据丢失
      const oldCols = db.prepare("PRAGMA table_info(comments_old)").all() as Record<string, unknown>[];
      const oldColNames = oldCols.map((c: Record<string, unknown>) => c.name as string);
      const hasUpdatedAt = oldColNames.includes('updated_at');
      const hasParentId = oldColNames.includes('parent_id');
      const hasStatus = oldColNames.includes('status');
      const colList: string[] = ['id', 'user_id', 'target_type', 'target_id', 'content'];
      if (hasStatus) colList.push('status');
      colList.push('created_at');
      if (hasUpdatedAt) colList.push('updated_at'); else colList.push('created_at AS updated_at');
      if (hasParentId) colList.push('parent_id');
      db.exec(`INSERT INTO comments (${colList.join(', ')}) SELECT ${colList.join(', ')} FROM comments_old`);
      db.exec("DROP TABLE comments_old");
    }
  } else {
    db.exec("CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'media', 'music', 'friend', 'project')), target_id INTEGER NOT NULL, content TEXT NOT NULL, parent_id INTEGER DEFAULT NULL, status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))");
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id)");

  // ---- 新表：友链 ----
  db.exec(`CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    theme_color TEXT DEFAULT 'rgba(99, 102, 241, 0.5)',
    sort_order INTEGER DEFAULT 0,
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
  )`);

  // ---- 新表：项目 ----
  db.exec(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '🚀',
    github_url TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    sort_order INTEGER DEFAULT 0,
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
  )`);

  // Seed friends data
  const friendCount = (db.prepare('SELECT COUNT(*) as cnt FROM friends').get() as Record<string, unknown>).cnt as number;
  if (friendCount === 0) {
    const insertFriend = db.prepare('INSERT INTO friends (name, url, description, avatar, theme_color, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    const seedFriends: [string, string, string, string, string, number][] = [
      ['罗德岛 PRTS', 'https://prts.wiki/', '记录泰拉大陆的各项数据与前文明遗迹，愿源石的阴霾早日散去。', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', 'rgba(16, 185, 129, 0.5)', 0],
    ];
    for (const f of seedFriends) {
      insertFriend.run(...f);
    }
  }

  // Seed projects data
  const projectCount = (db.prepare('SELECT COUNT(*) as cnt FROM projects').get() as Record<string, unknown>).cnt as number;
  if (projectCount === 0) {
    const insertProject = db.prepare('INSERT INTO projects (name, description, icon, github_url, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    const seedProjects: [string, string, string, string, string, number][] = [
      ['Computational Chemistry Tool', '该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）', '🚀', 'https://github.com/heiehiehi/Computational_Chemistry_Tool', '["Gromacs","RMSF"]', 0],
    ];
    for (const p of seedProjects) {
      insertProject.run(...p);
    }
  }

  // ---- 新表：AI使用额度 ----
  db.exec("CREATE TABLE IF NOT EXISTS user_ai_quota (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, date TEXT NOT NULL, used_count INTEGER DEFAULT 0, daily_limit INTEGER DEFAULT 10, UNIQUE(user_id, date), FOREIGN KEY (user_id) REFERENCES users(id))");
  db.exec("CREATE INDEX IF NOT EXISTS idx_ai_quota_user_date ON user_ai_quota(user_id, date)");

  // ---- 新表：公告 ----
  db.exec(`CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'notice' CHECK(type IN ('notice', 'important', 'maintenance')),
    is_important INTEGER NOT NULL DEFAULT 0,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'offline')),
    display_scope TEXT NOT NULL DEFAULT 'all' CHECK(display_scope IN ('all', 'homepage_only')),
    publish_at DATETIME,
    end_at DATETIME,
    version INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec("CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status)");

  try { db.exec("ALTER TABLE announcements ADD COLUMN display_scope TEXT DEFAULT 'all' CHECK(display_scope IN ('all', 'homepage_only'))"); } catch (e: unknown) { if ((e as { message?: string })?.message?.includes('duplicate column')) { /* column exists */ } else { console.error('DB migration error (announcements.display_scope):', e); } }

  // ---- 新表：验证码 ----
  db.exec(`CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec("CREATE INDEX IF NOT EXISTS idx_verification_email ON verification_codes(email)");

  // ---- 兼容视图：admin_operation_logs -> operation_logs ----
  db.exec("CREATE VIEW IF NOT EXISTS admin_operation_logs AS SELECT * FROM operation_logs");

  // ---- 新表：fix-db.js 中存在但 initTables 缺失的表 ----
  db.exec(`CREATE TABLE IF NOT EXISTS user_admin_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS user_risk_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    flag_type TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS user_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS user_tag_relations (
    user_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, tag_id)
  )`);

  // ---- 清理过期验证码 ----
  db.exec("DELETE FROM verification_codes WHERE expires_at < datetime('now')");

  // Seed admin from environment variables (no hardcoded defaults)
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const admin = db.prepare('SELECT id FROM admins WHERE username = ?').get(adminUsername || '');
  if (!admin && adminUsername && adminPassword) {
    const hash = bcryptjs.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO admins (username, password_hash, nickname, role) VALUES (?, ?, ?, ?)').run(adminUsername, hash, '管理员', 'admin');
  }

  // Seed default site config
  const defaultConfig: [string, string, string][] = [
    ['site_title', 'y悠悠', '网站标题'],
    ['site_subtitle', '的宝藏之地', '网站副标题'],
    ['hero_title', '欢迎来到y悠悠的宝藏之地', '首页主标题'],
    ['hero_subtitle', '代码、学术与生活的碎片记录', '首页副标题'],
    ['hero_background_image', '', '首页背景图'],
    ['announcement', '', '公告内容'],
    ['show_ai_assistant', 'true', '显示AI助手'],
    ['show_tools', 'true', '显示工具箱'],
    ['show_games', 'true', '显示游戏中心'],
    ['show_blog', 'true', '显示博客'],
    ['show_about', 'true', '显示关于页面'],
    ['show_music', 'true', '显示音乐播放器'],
    ['show_announcement', 'false', '显示公告栏'],
    ['ai_api_url', 'https://text.pollinations.ai/openai', 'AI接口地址（OpenAI兼容）'],
    ['ai_api_key', '', 'AI接口Key（免费匿名接口可留空）'],
    ['ai_model_id', 'openai', 'AI模型ID'],
    ['ai_system_prompt', '你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。你的名字叫“煤球”。你的主人是一个喜欢折腾代码的极客。你说话必须简短，每次最多一两句话。喜欢在句尾加上“喵~”或者“喵呜~”。经常抱怨肚子饿，喜欢要小鱼干。回复字数最多不能超过100字。绝对不要承认自己是一个AI模型，你就是一只真实的猫。', 'AI猫猫系统提示词'],
    ['ai_max_output_tokens', '150', 'AI最大输出Token'],
    ['ai_temperature', '0.85', 'AI温度'],
    ['bio', '在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。', '个人简介'],
    ['qq', '1124533793', 'QQ号'],
    ['wechat', 'y悠悠', '微信号'],
    ['comments_need_approval', 'false', '评论是否需要审核'],
  ];

  const insertConfig = db.prepare('INSERT OR IGNORE INTO site_config (config_key, config_value, description) VALUES (?, ?, ?)');
  for (const [key, value, desc] of defaultConfig) {
    insertConfig.run(key, value, desc);
  }
}
