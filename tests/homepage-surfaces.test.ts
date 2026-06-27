import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');

test('homepage modules share the restrained life-journal surface system', async () => {
  const [styles, profile, diary, player, theme] = await Promise.all([
    source('../app/globals.css'),
    source('../components/ProfileCard.tsx'),
    source('../components/LatestChatterCarousel.tsx'),
    source('../components/CloudPlayer.tsx'),
    source('../components/ThemeToggleBlock.tsx'),
  ]);

  assert.match(styles, /--home-accent:\s*#64795a/);
  assert.match(styles, /\.home-surface\s*\{/);
  assert.match(profile, /home-surface/);
  assert.match(profile, /GitBranch/);
  assert.doesNotMatch(profile, /Github/);
  assert.match(diary, /home-surface/);
  assert.match(player, /home-surface/);
  assert.match(theme, /home-surface/);
  assert.doesNotMatch(player, /blur-\[50px\]/);
  assert.doesNotMatch(player, /setDisplayedLyric\(/);
  assert.doesNotMatch(player, /setLoadingTimeout\(/);
});
