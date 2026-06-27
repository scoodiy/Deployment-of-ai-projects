import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const backupScriptUrl = new URL('../ops/backup.sh', import.meta.url);

test('database backup requires SQLite online backup support and validates the result', async () => {
  const source = await readFile(backupScriptUrl, 'utf8');

  assert.match(source, /umask 077/);
  assert.match(source, /command -v sqlite3/);
  assert.doesNotMatch(source, /cp "\$DB_FILE" "\$BACKUP_FILE"/);
  assert.match(source, /PRAGMA integrity_check/);
});
