import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const file = (path: string) => new URL(`../${path}`, import.meta.url);

test('homepage lyric bar shows a denser row of lyrics on wider screens', async () => {
  const lyricBar = await readFile(file('components/LyricBar.tsx'), 'utf8');

  assert.match(lyricBar, /Math\.floor\(width \/ 150\)/);
  assert.match(lyricBar, /Math\.min\(lines, 7\)/);
  assert.match(lyricBar, /gap-4/);
});
