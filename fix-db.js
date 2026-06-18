const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'ayuu.db');
const BACKUP_PATH = path.join(__dirname, 'data', 'ayuu.db.bak');
const NEW_PATH = path.join(__dirname, 'data', 'ayuu_new.db');

// Step 1: Dump all data from existing database
console.log('Step 1: Dumping data...');
const db = new Database(DB_PATH);
db.pragma('wal_checkpoint(TRUNCATE)');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite%'").all();
const dump = {};

for (const t of tables) {
  try {
    dump[t.name] = db.prepare(`SELECT * FROM ${t.name}`).all();
    console.log(`  ${t.name}: ${dump[t.name].length} rows`);
  } catch (e) {
    console.log(`  ${t.name}: ERROR - ${e.message}`);
    dump[t.name] = null;
  }
}

// Get CREATE TABLE statements
const schemas = {};
for (const t of tables) {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(t.name);
  schemas[t.name] = row ? row.sql : null;
}

// Get indexes
const indexes = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL").all();

db.close();

// Step 2: Create new database with fixed schema
console.log('\nStep 2: Creating new database with fixed schema...');
if (fs.existsSync(NEW_PATH)) fs.unlinkSync(NEW_PATH);
const newDb = new Database(NEW_PATH);
newDb.pragma('journal_mode = WAL');
newDb.pragma('foreign_keys = OFF'); // OFF during migration

// Create tables with correct quoting
newDb.exec(`
  CREATE TABLE admins (
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

  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    signature TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'banned')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ban_reason TEXT DEFAULT '',
    admin_remark TEXT DEFAULT '',
    ai_daily_limit INTEGER DEFAULT 10,
    must_change_password INTEGER DEFAULT 0,
    last_login_at DATETIME,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'super_admin')),
    version INTEGER DEFAULT 1,
    login_count INTEGER DEFAULT 0
  );

  CREATE TABLE blogs (
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
    published_at DATETIME,
    version INTEGER DEFAULT 1
  );

  CREATE TABLE media_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_type TEXT DEFAULT 'image' CHECK(file_type IN ('image', 'audio', 'video', 'document')),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT '',
    usage_type TEXT DEFAULT 'other' CHECK(usage_type IN ('home_background', 'blog_cover', 'gallery', 'avatar', 'about', 'other')),
    alt_text TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
  );

  CREATE TABLE music (
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
  );

  CREATE TABLE site_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT DEFAULT '',
    description TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
  );

  CREATE TABLE operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id INTEGER,
    detail TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
  );

  CREATE TABLE likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
  );

  CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('blog', 'media', 'music', 'friend', 'project')),
    target_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE friends (
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
  );

  CREATE TABLE projects (
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
  );

  CREATE TABLE user_ai_quota (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    used_count INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 10,
    UNIQUE(user_id, date)
  );

  CREATE TABLE user_admin_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE user_risk_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    flag_type TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE user_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE user_tag_relations (
    user_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, tag_id)
  );
`);

// Create indexes
newDb.exec(`
  CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
  CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
  CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
  CREATE INDEX IF NOT EXISTS idx_music_enabled ON music(is_enabled);
  CREATE INDEX IF NOT EXISTS idx_operation_logs_admin ON operation_logs(admin_id);
  CREATE INDEX IF NOT EXISTS idx_site_config_key ON site_config(config_key);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_target ON favorites(target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
  CREATE INDEX IF NOT EXISTS idx_likes_target ON likes(target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
  CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_ai_quota_user_date ON user_ai_quota(user_id, date);
`);

// Step 3: Copy data
console.log('\nStep 3: Copying data...');
// Get list of tables in new db
const newTables = newDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);

for (const [table, rows] of Object.entries(dump)) {
  if (!rows || rows.length === 0) continue;
  if (!newTables.includes(table)) {
    console.log(`  ${table}: SKIPPED (table not in new schema)`);
    continue;
  }
  
  // Get columns for this table from new schema
  const newCols = newDb.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  const oldCols = Object.keys(rows[0]);
  
  // Only use columns that exist in new table
  const validCols = oldCols.filter(c => newCols.includes(c));
  const placeholders = validCols.map(() => '?').join(', ');
  const colList = validCols.join(', ');
  
  const insert = newDb.prepare(`INSERT OR IGNORE INTO ${table} (${colList}) VALUES (${placeholders})`);
  
  let inserted = 0;
  for (const row of rows) {
    const values = validCols.map(c => row[c] !== undefined ? row[c] : null);
    try {
      insert.run(...values);
      inserted++;
    } catch (e) {
      console.log(`  ${table}: Error inserting row - ${e.message}`);
    }
  }
  console.log(`  ${table}: ${inserted}/${rows.length} rows copied`);
}

// Step 4: Seed data
console.log('\nStep 4: Seeding data...');

// Seed friends if empty
const fc = newDb.prepare('SELECT COUNT(*) as cnt FROM friends').get().cnt;
if (fc === 0) {
  newDb.prepare('INSERT INTO friends (name, url, description, avatar, theme_color) VALUES (?, ?, ?, ?, ?)')
    .run('罗德岛 PRTS', 'https://prts.wiki/', '记录泰拉大陆的各项数据与前文明遗迹，愿源石的阴霾早日散去。', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', 'rgba(16, 185, 129, 0.5)');
  console.log('  Seeded friends');
}

// Seed projects if empty
const pc = newDb.prepare('SELECT COUNT(*) as cnt FROM projects').get().cnt;
if (pc === 0) {
  newDb.prepare('INSERT INTO projects (name, description, icon, github_url, tags) VALUES (?, ?, ?, ?, ?)')
    .run('Computational Chemistry Tool', '该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）', '🚀', 'https://github.com/heiehiehi/Computational_Chemistry_Tool', '["Gromacs","RMSF"]');
  console.log('  Seeded projects');
}

newDb.pragma('wal_checkpoint(TRUNCATE)');
newDb.close();

// Step 5: Swap databases
console.log('\nStep 5: Swapping databases...');
fs.copyFileSync(DB_PATH, BACKUP_PATH);
fs.copyFileSync(NEW_PATH, DB_PATH);
fs.unlinkSync(NEW_PATH);
// Remove WAL/SHM files
try { fs.unlinkSync(DB_PATH + '-wal'); } catch(e) {}
try { fs.unlinkSync(DB_PATH + '-shm'); } catch(e) {}

console.log('\nDone! Backup at:', BACKUP_PATH);

// Step 6: Verify
console.log('\nStep 6: Verifying...');
const verifyDb = new Database(DB_PATH);
const checkTables = verifyDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', checkTables.map(t => t.name).join(', '));

// Test the users schema
const userSchema = verifyDb.prepare("SELECT sql FROM sqlite_master WHERE name='users'").get();
console.log('Users schema OK:', !userSchema.sql.includes('"user"'));

// Test the comments schema
const commentCols = verifyDb.prepare('PRAGMA table_info(comments)').all().map(c => c.name);
console.log('Comments has parent_id:', commentCols.includes('parent_id'));

verifyDb.close();
