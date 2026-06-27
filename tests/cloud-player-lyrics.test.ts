import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const file = (path: string) => new URL(`../${path}`, import.meta.url);

test('homepage now-playing card renders a compact multi-line lyric stack', async () => {
  const cloudPlayer = await readFile(file('components/CloudPlayer.tsx'), 'utf8');

  assert.match(cloudPlayer, /lyrics,\s*currentLyricIndex/);
  assert.match(cloudPlayer, /visibleLyrics/);
  assert.match(cloudPlayer, /lyrics\.slice\(start,\s*end\)/);
  assert.match(cloudPlayer, /max-h-\[124px\]/);
  assert.doesNotMatch(cloudPlayer, /h-6 truncate text-sm text-\[var\(--home-muted\)\]/);
});
