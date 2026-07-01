import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const file = (path: string) => new URL(`../${path}`, import.meta.url);

test('content security policy allows Next runtime scripts while retaining a default self policy', async () => {
  const config = await readFile(file('next.config.ts'), 'utf8');

  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /default-src 'self'/);
  assert.match(config, /script-src 'self' 'unsafe-inline'/);
  assert.match(config, /media-src[^"]*'self'/);
  assert.match(config, /media-src[^"]*https:\/\/music\.163\.com/);
  assert.match(config, /media-src[^"]*https:\/\/.*?music\.126\.net/);
  assert.match(config, /frame-ancestors 'self'/);
});

test('content security policy allows local camera preview media sources', async () => {
  const config = await readFile(file('next.config.ts'), 'utf8');

  assert.match(config, /media-src[^"]*blob:/);
  assert.match(config, /media-src[^"]*data:/);
  assert.match(config, /media-src[^"]*mediastream:/);
});

test('permissions policy allows same-origin camera access for the camera OCR tool', async () => {
  const config = await readFile(file('next.config.ts'), 'utf8');

  assert.match(config, /Permissions-Policy/);
  assert.match(config, /camera=\(self\)/);
  assert.match(config, /microphone=\(self\)/);
  assert.doesNotMatch(config, /camera=self/);
  assert.doesNotMatch(config, /microphone=self/);
});
