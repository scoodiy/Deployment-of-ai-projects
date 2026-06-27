import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const file = (path: string) => new URL(`../${path}`, import.meta.url);

test('music provider does not attach an audio source before user activation', async () => {
  const provider = await readFile(file('components/MusicProvider.tsx'), 'utf8');

  assert.match(provider, /const \[hasUserActivated, setHasUserActivated\] = useState\(false\)/);
  assert.match(provider, /const activeAudioSrc = hasUserActivated \? currentSong\?\.src : undefined/);
  assert.match(provider, /src=\{activeAudioSrc\}/);
  assert.match(provider, /preload="none"/);
  assert.match(provider, /setHasUserActivated\(true\)/);
});

test('homepage player exposes a real play button when music has not loaded', async () => {
  const cloudPlayer = await readFile(file('components/CloudPlayer.tsx'), 'utf8');

  assert.match(cloudPlayer, /onStart\?: \(\) => void/);
  assert.match(cloudPlayer, /title="播放音乐"/);
  assert.match(cloudPlayer, /onStart=\{togglePlay\}/);
  assert.match(cloudPlayer, /点击播放按钮开始/);
});
