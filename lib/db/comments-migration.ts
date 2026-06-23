import Database from 'better-sqlite3';

const COMMENTS_TABLE_SQL = `
  CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_key TEXT NOT NULL,
    target_id INTEGER,
    content TEXT NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`;

function createCommentsIndexes(db: Database.Database) {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_comments_public
      ON comments(target_type, target_key, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
  `);
}

type ColumnInfo = {
  name: string;
  notnull: number;
  dflt_value: string | null;
};

type SchemaObject = {
  sql: string;
};

function hasIndex(db: Database.Database, indexName: string, expectedColumns: { name: string; descending: number }[]) {
  const index = db.prepare(`
    SELECT name, [unique] AS is_unique, partial
    FROM pragma_index_list('comments')
    WHERE name = ?
  `).get(indexName) as { name: string; is_unique: number; partial: number } | undefined;
  if (!index || index.is_unique !== 0 || index.partial !== 0) {
    return false;
  }

  const columns = db.prepare(`
    SELECT name, [desc] AS descending
    FROM pragma_index_xinfo(?)
    WHERE [key] = 1
    ORDER BY seqno
  `).all(indexName) as { name: string; descending: number }[];
  return JSON.stringify(columns) === JSON.stringify(expectedColumns);
}

function hasCurrentCommentsSchema(db: Database.Database, columns: ColumnInfo[], tableSql: string) {
  const columnByName = new Map(columns.map((column) => [column.name, column]));
  const requiredColumns = [
    'id',
    'user_id',
    'target_type',
    'target_key',
    'target_id',
    'content',
    'parent_id',
    'status',
    'created_at',
    'updated_at',
  ];
  const hasAllColumns = requiredColumns.every((name) => columnByName.has(name));
  const requiredValuesAreNotNull = ['user_id', 'target_type', 'target_key', 'content', 'status']
    .every((name) => columnByName.get(name)?.notnull === 1);
  const targetKeyIsNotNull = columnByName.get('target_key')?.notnull === 1;
  const targetIdIsNullable = columnByName.get('target_id')?.notnull === 0;
  const statusIsNotNull = columnByName.get('status')?.notnull === 1;
  const statusHasPendingDefault = columnByName.get('status')?.dflt_value === "'pending'";
  const hasStatusCheck = /CHECK\s*\(\s*status\s+IN\s*\(\s*'pending'\s*,\s*'approved'\s*,\s*'rejected'\s*\)\s*\)/i.test(tableSql);
  const foreignKeys = db.prepare("SELECT [table], [from], [to] FROM pragma_foreign_key_list('comments')").all() as {
    table: string;
    from: string;
    to: string;
  }[];
  const hasUserForeignKey = foreignKeys.some((foreignKey) => (
    foreignKey.table === 'users'
    && foreignKey.from === 'user_id'
    && foreignKey.to === 'id'
  ));
  const hasPublicIndex = hasIndex(db, 'idx_comments_public', [
    { name: 'target_type', descending: 0 },
    { name: 'target_key', descending: 0 },
    { name: 'status', descending: 0 },
    { name: 'created_at', descending: 1 },
  ]);
  const hasUserIndex = hasIndex(db, 'idx_comments_user', [{ name: 'user_id', descending: 0 }]);

  return hasAllColumns
    && requiredValuesAreNotNull
    && targetKeyIsNotNull
    && targetIdIsNullable
    && statusIsNotNull
    && statusHasPendingDefault
    && hasStatusCheck
    && hasUserForeignKey
    && hasPublicIndex
    && hasUserIndex;
}

function getCustomCommentsSchemaObjects(db: Database.Database) {
  return db.prepare(`
    SELECT sql
    FROM sqlite_master
    WHERE tbl_name = 'comments'
      AND type IN ('index', 'trigger')
      AND sql IS NOT NULL
      AND name NOT LIKE 'sqlite_autoindex%'
      AND name NOT IN ('idx_comments_target', 'idx_comments_public', 'idx_comments_user')
    ORDER BY type, name
  `).all() as SchemaObject[];
}

export function migrateCommentsTable(db: Database.Database) {
  const migrate = db.transaction(() => {
    const table = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'comments'").get() as { sql: string } | undefined;
    if (!table) {
      db.exec(COMMENTS_TABLE_SQL);
      createCommentsIndexes(db);
      return;
    }

    const columns = db.prepare('PRAGMA table_info(comments)').all() as ColumnInfo[];
    const names = new Set(columns.map((column) => column.name));
    if (hasCurrentCommentsSchema(db, columns, table.sql)) {
      return;
    }

    const customObjects = getCustomCommentsSchemaObjects(db);

    db.exec(`
      DROP INDEX IF EXISTS idx_comments_target;
      DROP INDEX IF EXISTS idx_comments_public;
      DROP INDEX IF EXISTS idx_comments_user;
      ALTER TABLE comments RENAME TO comments_legacy;
    `);
    db.exec(COMMENTS_TABLE_SQL);

    const targetId = names.has('target_id') ? 'target_id' : 'NULL';
    const targetKey = names.has('target_key')
      ? (names.has('target_id')
        ? "COALESCE(NULLIF(target_key, ''), CAST(target_id AS TEXT), '')"
        : "COALESCE(NULLIF(target_key, ''), '')")
      : "COALESCE(CAST(target_id AS TEXT), '')";
    const parentId = names.has('parent_id') ? 'parent_id' : 'NULL';
    const status = names.has('status') ? "COALESCE(status, 'pending')" : "'pending'";
    const createdAt = names.has('created_at') ? 'created_at' : 'CURRENT_TIMESTAMP';
    const updatedAt = names.has('updated_at') ? 'updated_at' : createdAt;

    db.exec(`
      INSERT INTO comments (
        id, user_id, target_type, target_key, target_id, content, parent_id, status, created_at, updated_at
      )
      SELECT
        id, user_id, target_type, ${targetKey}, ${targetId}, content, ${parentId}, ${status}, ${createdAt}, ${updatedAt}
      FROM comments_legacy;
      DROP TABLE comments_legacy;
    `);
    const foreignKeyViolations = db.prepare("PRAGMA foreign_key_check('comments')").all();
    if (foreignKeyViolations.length > 0) {
      throw new Error('Comment migration aborted: foreign key violations detected');
    }
    createCommentsIndexes(db);
    for (const object of customObjects) {
      db.exec(object.sql);
    }
  });

  const foreignKeysEnabled = db.pragma('foreign_keys', { simple: true }) === 1;
  if (foreignKeysEnabled) {
    db.pragma('foreign_keys = OFF');
  }

  try {
    migrate();
  } finally {
    if (foreignKeysEnabled) {
      db.pragma('foreign_keys = ON');
    }
  }
}
