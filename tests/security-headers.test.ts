import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const file = (path: string) => new URL(`../${path}`, import.meta.url);

test('content security policy allows Next runtime scripts while retaining a default self policy', async () => {
  const config = await readFile(file('next.config.ts'), 'utf8');

  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /default-src 'self'/);
  assert.match(config, /script-src 'self' 'unsafe-inline'/);
  assert.match(config, /media-src 'self' https:\/\/music\.163\.com https:\/\/.*?music\.126\.net/);
  assert.match(config, /frame-ancestors 'self'/);
});
