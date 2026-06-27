import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const projectRoot = new URL('../', import.meta.url);
const profileCardUrl = new URL('../components/ProfileCard.tsx', import.meta.url);

test('profile card falls back to the deployed local avatar asset', async () => {
  const profileCard = await readFile(profileCardUrl, 'utf8');

  assert.doesNotMatch(profileCard, /\/default-avatar\.png/);
  assert.match(profileCard, /\/images\/optimized\/avatar\.webp/);
});

test('configured hero background points to an existing local image', async () => {
  const { stdout } = await execFileAsync('sqlite3', [
    'data/ayuu.db',
    "SELECT config_value FROM site_config WHERE config_key = 'hero_background_image';",
  ], { cwd: fileURLToPath(projectRoot) });
  const imageUrl = stdout.trim();

  assert.equal(imageUrl, '/images/optimized/bg-1.webp');
  const asset = await stat(path.join(fileURLToPath(projectRoot), 'public', imageUrl));
  assert.ok(asset.isFile());
});
