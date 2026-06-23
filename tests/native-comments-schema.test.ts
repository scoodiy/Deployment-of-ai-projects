import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';
import { migrateCommentsTable } from '../lib/db/comments-migration.ts';

test('migrates legacy numeric target IDs to stable text keys', () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); INSERT INTO users (id) VALUES (7);');
  db.exec(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  db.prepare(`
    INSERT INTO comments (id, user_id, target_type, target_id, content, status, created_at)
    VALUES (1, 7, 'blog', 42, 'legacy', 'approved', '2026-01-01 10:00:00')
  `).run();

  migrateCommentsTable(db);

  assert.deepEqual(
    db.prepare('SELECT target_type, target_key, target_id FROM comments WHERE id = 1').get(),
    { target_type: 'blog', target_key: '42', target_id: 42 },
  );
});

test('normalizes legacy null statuses to pending without dropping the comment', () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); INSERT INTO users (id) VALUES (7);');
  db.exec(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      status TEXT,
      created_at TEXT NOT NULL
    )
  `);
  db.prepare(`
    INSERT INTO comments (id, user_id, target_type, target_id, content, status, created_at)
    VALUES (6, 7, 'blog', 42, 'legacy null status', NULL, '2026-01-06')
  `).run();

  migrateCommentsTable(db);

  assert.deepEqual(
    db.prepare('SELECT id, status FROM comments WHERE id = 6').get(),
    { id: 6, status: 'pending' },
  );
  assert.equal((db.prepare('SELECT COUNT(*) AS count FROM comments').get() as { count: number }).count, 1);
});

test('creates the current comments schema for an empty database', () => {
  const db = new Database(':memory:');

  migrateCommentsTable(db);

  const columns = db.prepare("SELECT name FROM pragma_table_info('comments')").all() as { name: string }[];
  const indexes = db.prepare("SELECT name FROM pragma_index_list('comments')").all() as { name: string }[];
  const publicIndex = db.prepare(`
    SELECT name, [desc] AS descending
    FROM pragma_index_xinfo('idx_comments_public')
    WHERE [key] = 1
    ORDER BY seqno
  `).all();
  const userIndex = db.prepare(`
    SELECT name, [desc] AS descending
    FROM pragma_index_xinfo('idx_comments_user')
    WHERE [key] = 1
    ORDER BY seqno
  `).all();
  assert.ok(columns.some((column) => column.name === 'target_key'));
  assert.ok(columns.some((column) => column.name === 'parent_id'));
  assert.ok(columns.some((column) => column.name === 'updated_at'));
  assert.ok(indexes.some((index) => index.name === 'idx_comments_public'));
  assert.ok(indexes.some((index) => index.name === 'idx_comments_user'));
  assert.deepEqual(publicIndex, [
    { name: 'target_type', descending: 0 },
    { name: 'target_key', descending: 0 },
    { name: 'status', descending: 0 },
    { name: 'created_at', descending: 1 },
  ]);
  assert.deepEqual(userIndex, [{ name: 'user_id', descending: 0 }]);
});

test('rebuilds a required index when a same-named partial unique index exists', () => {
  const db = new Database(':memory:');
  migrateCommentsTable(db);
  db.exec(`
    DROP INDEX idx_comments_public;
    CREATE UNIQUE INDEX idx_comments_public
      ON comments(target_type, target_key, status, created_at DESC)
      WHERE status = 'approved';
  `);

  migrateCommentsTable(db);

  const publicIndex = db.prepare("SELECT [unique] AS is_unique, partial FROM pragma_index_list('comments') WHERE name = 'idx_comments_public'").get() as {
    is_unique: number;
    partial: number;
  };
  assert.deepEqual(publicIndex, { is_unique: 0, partial: 0 });
});

test('preserves legacy reply and update timestamps across migration', () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); INSERT INTO users (id) VALUES (7);');
  db.exec(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  db.prepare(`
    INSERT INTO comments (
      id, user_id, target_type, target_id, content, parent_id, status, created_at, updated_at
    ) VALUES (2, 7, 'blog', 42, 'reply', 1, 'pending', '2026-01-02 10:00:00', '2026-01-03 10:00:00')
  `).run();

  migrateCommentsTable(db);
  migrateCommentsTable(db);

  assert.deepEqual(
    db.prepare('SELECT target_key, parent_id, status, created_at, updated_at FROM comments WHERE id = 2').get(),
    {
      target_key: '42',
      parent_id: 1,
      status: 'pending',
      created_at: '2026-01-02 10:00:00',
      updated_at: '2026-01-03 10:00:00',
    },
  );
});

test('rebuilds incomplete target-key schemas with nullable target IDs and a status check', () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY)');
  db.prepare('INSERT INTO users (id) VALUES (7)').run();
  db.exec(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  db.prepare(`
    INSERT INTO comments (
      id, user_id, target_type, target_key, target_id, content, parent_id, status, created_at, updated_at
    ) VALUES (3, 7, 'lab', 'workshop-2026-05', 9, 'legacy', NULL, 'approved', '2026-01-04', '2026-01-04')
  `).run();

  migrateCommentsTable(db);

  const targetId = db.prepare("SELECT * FROM pragma_table_info('comments') WHERE name = 'target_id'").get() as { notnull: number };
  assert.equal(targetId.notnull, 0);
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO comments (user_id, target_type, target_key, target_id, content, status)
      VALUES (7, 'lab', 'standalone', NULL, 'new comment', 'approved')
    `).run();
  });
  assert.throws(() => {
    db.prepare(`
      INSERT INTO comments (user_id, target_type, target_key, target_id, content, status)
      VALUES (7, 'lab', 'standalone', NULL, 'invalid status', 'unknown')
    `).run();
  }, /CHECK constraint failed/);
});

test('migrates a target-key table that has no target ID column', () => {
  const db = new Database(':memory:');
  db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); INSERT INTO users (id) VALUES (7);');
  db.exec(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  db.prepare(`
    INSERT INTO comments (id, user_id, target_type, target_key, content, parent_id, status, created_at, updated_at)
    VALUES (4, 7, 'lab', 'stable-key', 'legacy', NULL, 'approved', '2026-01-04', '2026-01-04')
  `).run();

  migrateCommentsTable(db);

  assert.deepEqual(
    db.prepare('SELECT target_key, target_id FROM comments WHERE id = 4').get(),
    { target_key: 'stable-key', target_id: null },
  );
});

test('rebuilds a target-key table without the required user foreign key', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY);
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      target_id INTEGER,
      content TEXT NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_comments_public ON comments(target_type, target_key, status, created_at DESC);
    CREATE INDEX idx_comments_user ON comments(user_id);
  `);

  migrateCommentsTable(db);

  assert.deepEqual(
    db.prepare("SELECT [table], [from], [to] FROM pragma_foreign_key_list('comments')").all(),
    [{ table: 'users', from: 'user_id', to: 'id' }],
  );
});

test('rebuilds a target-key schema missing required nullability and default constraints', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY);
    INSERT INTO users (id) VALUES (7);
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_key TEXT,
      target_id INTEGER,
      content TEXT NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX idx_comments_public ON comments(target_type, target_key, status, created_at DESC);
    CREATE INDEX idx_comments_user ON comments(user_id);
  `);

  migrateCommentsTable(db);

  const columns = db.prepare("SELECT name, [notnull] AS not_null, dflt_value FROM pragma_table_info('comments')").all() as {
    name: string;
    not_null: number;
    dflt_value: string | null;
  }[];
  const targetKey = columns.find((column) => column.name === 'target_key');
  const status = columns.find((column) => column.name === 'status');
  assert.deepEqual(targetKey, { name: 'target_key', not_null: 1, dflt_value: null });
  assert.deepEqual(status, { name: 'status', not_null: 1, dflt_value: "'pending'" });
});

test('rebuilds a schema where required comment values are nullable', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY);
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      target_type TEXT,
      target_key TEXT NOT NULL,
      target_id INTEGER,
      content TEXT,
      parent_id INTEGER DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX idx_comments_public ON comments(target_type, target_key, status, created_at DESC);
    CREATE INDEX idx_comments_user ON comments(user_id);
  `);

  migrateCommentsTable(db);

  const columns = db.prepare("SELECT name, [notnull] AS not_null FROM pragma_table_info('comments')").all() as {
    name: string;
    not_null: number;
  }[];
  for (const name of ['user_id', 'target_type', 'content']) {
    assert.equal(columns.find((column) => column.name === name)?.not_null, 1);
  }
});

test('rolls back an orphaned legacy comment instead of bypassing the user foreign key', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY);
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      status TEXT,
      created_at TEXT NOT NULL
    );
  `);
  db.prepare(`
    INSERT INTO comments (id, user_id, target_type, target_id, content, status, created_at)
    VALUES (99, 404, 'blog', 42, 'orphan', 'approved', '2026-01-07')
  `).run();
  db.pragma('foreign_keys = ON');

  assert.throws(() => migrateCommentsTable(db), /foreign key violations/i);
  assert.deepEqual(
    db.prepare('SELECT id, user_id FROM comments WHERE id = 99').get(),
    { id: 99, user_id: 404 },
  );
  assert.equal(db.pragma('foreign_keys', { simple: true }), 1);
});

test('preserves custom comments indexes and triggers through a rebuild', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY);
    INSERT INTO users (id) VALUES (7);
    CREATE TABLE comment_audit (comment_id INTEGER NOT NULL);
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX comments_content_lookup ON comments(content);
    CREATE TRIGGER comments_audit_insert AFTER INSERT ON comments
    BEGIN
      INSERT INTO comment_audit (comment_id) VALUES (NEW.id);
    END;
  `);
  db.prepare(`
    INSERT INTO comments (id, user_id, target_type, target_id, content, status, created_at)
    VALUES (5, 7, 'blog', 42, 'legacy', 'approved', '2026-01-05')
  `).run();
  db.prepare('DELETE FROM comment_audit').run();

  migrateCommentsTable(db);

  assert.ok(db.prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'comments_content_lookup'").get());
  assert.ok(db.prepare("SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = 'comments_audit_insert'").get());
  db.prepare(`
    INSERT INTO comments (user_id, target_type, target_key, target_id, content, status)
    VALUES (7, 'blog', '42', NULL, 'new comment', 'approved')
  `).run();
  assert.equal((db.prepare('SELECT COUNT(*) AS count FROM comment_audit').get() as { count: number }).count, 1);
});

test('rolls back when a custom index is incompatible with the current schema', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      legacy_sort INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX comments_legacy_sort ON comments(legacy_sort);
  `);

  assert.throws(() => migrateCommentsTable(db), /no such column: legacy_sort/);
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'comments'").get());
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'comments_legacy_sort'").get());
});
