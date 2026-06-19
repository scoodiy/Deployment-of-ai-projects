import Database from 'better-sqlite3';
import path from 'path';
import bcryptjs from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'ayuu.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
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
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
      view_count INTEGER DEFAULT 0,
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  try { db.exec('ALTER TABLE blogs ADD COLUMN version INTEGER DEFAULT 1'); } catch (e) { /* column exists */ }
  try { db.exec('ALTER TABLE site_config ADD COLUMN version INTEGER DEFAULT 1'); } catch (e) { /* column exists */ }
  try { db.exec('ALTER TABLE music ADD COLUMN version INTEGER DEFAULT 1'); } catch (e) { /* column exists */ }
  try { db.exec('ALTER TABLE media_files ADD COLUMN version INTEGER DEFAULT 1'); } catch (e) { /* column exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN version INTEGER DEFAULT 1'); } catch (e) { /* column exists */ }
  try { db.exec('ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0'); } catch (e) { /* column exists */ }

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
    // 旧表存在，检查是否有 parent_id 和 updated_at 列
    const cols = db.prepare("PRAGMA table_info(comments)").all() as Record<string, unknown>[];
    const colNames = cols.map((c: any) => c.name as string);
    if (!colNames.includes('parent_id')) {
      // 重建表以扩展 CHECK 约束并添加新列
      db.exec("ALTER TABLE comments RENAME TO comments_old");
      db.exec("CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'media', 'music', 'friend', 'project')), target_id INTEGER NOT NULL, content TEXT NOT NULL, parent_id INTEGER DEFAULT NULL, status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))");
      db.exec("INSERT INTO comments (id, user_id, target_type, target_id, content, status, created_at, updated_at) SELECT id, user_id, target_type, target_id, content, status, created_at, created_at FROM comments_old");
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
    ['bio', '在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。', '个人简介'],
    ['qq', '1124533793', 'QQ号'],
    ['wechat', 'y悠悠', '微信号'],
  ];

  const insertConfig = db.prepare('INSERT OR IGNORE INTO site_config (config_key, config_value, description) VALUES (?, ?, ?)');
  for (const [key, value, desc] of defaultConfig) {
    insertConfig.run(key, value, desc);
  }
}
