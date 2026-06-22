import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workshopUrl = new URL('../app/tree/CreativeWorkshopClient.tsx', import.meta.url);
const pageUrl = new URL('../app/tree/page.tsx', import.meta.url);
const alchemyUrl = new URL('../app/tree/AlchemyLab.tsx', import.meta.url);

test('creative workshop accepts typed content collections', async () => {
  const source = await readFile(workshopUrl, 'utf8');

  assert.match(source, /type ContentItem = \{/);
  assert.match(source, /type CreativeWorkshopClientProps = \{/);
  assert.doesNotMatch(source, /\{ posts = \[\], chatters = \[\], moments = \[\] \}: any/);
});

test('creative workshop loader returns typed content items', async () => {
  const source = await readFile(pageUrl, 'utf8');

  assert.match(source, /type TreeContentItem = \{/);
  assert.match(source, /function getLocalItems\([^)]*\): TreeContentItem\[\]/);
  assert.doesNotMatch(source, /let items: any\[\] = \[\]/);
});

test('alchemy lab keeps its UI and API data boundaries typed', async () => {
  const source = await readFile(alchemyUrl, 'utf8');

  assert.match(source, /type ContentItem = \{/);
  assert.match(source, /type Badge = \{/);
  assert.match(source, /type GitHubComment = \{/);
  assert.doesNotMatch(source, /\bany\b/);
});
