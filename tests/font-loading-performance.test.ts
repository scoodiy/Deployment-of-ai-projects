import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layoutUrl = new URL('../app/layout.tsx', import.meta.url);
const globalsUrl = new URL('../app/globals.css', import.meta.url);

test('root layout does not bundle full Noto Serif CJK font files', async () => {
  const layout = await readFile(layoutUrl, 'utf8');

  assert.doesNotMatch(layout, /NotoSerifSC-/);
  assert.doesNotMatch(layout, /notoSerif\.variable/);
});

test('site serif variable uses a local Chinese system font stack', async () => {
  const globals = await readFile(globalsUrl, 'utf8');

  assert.match(
    globals,
    /--font-serif:\s*"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif;/,
  );
  assert.doesNotMatch(globals, /--font-serif:\s*var\(--font-serif\)/);
});
