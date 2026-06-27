import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const siteConfigUrl = new URL('../siteConfig.ts', import.meta.url);
const chatterUrl = new URL('../chatters/hello.md', import.meta.url);
const albumsUrl = new URL('../data/albums.ts', import.meta.url);

test('static homepage fallbacks use deployed local images', async () => {
  const siteConfig = await readFile(siteConfigUrl, 'utf8');

  assert.match(siteConfig, /avatarUrl:\s*"\/images\/optimized\/avatar\.webp"/);
  assert.match(siteConfig, /photoWallImage:\s*"\/images\/optimized\/photowall\.webp"/);
});

test('homepage chatter card uses a local cover', async () => {
  const chatter = await readFile(chatterUrl, 'utf8');

  assert.match(chatter, /^cover: \/images\/optimized\/chatter-cover\.webp$/m);
});

test('homepage latest album card uses a local cover', async () => {
  const albums = await readFile(albumsUrl, 'utf8');

  assert.match(
    albums,
    /"id": "terra-journey"[\s\S]*?"cover": "\/images\/optimized\/photowall\.webp"/,
  );
});
