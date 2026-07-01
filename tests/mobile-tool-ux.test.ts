import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const file = (path: string) => new URL(`../${path}`, import.meta.url);

test('floating music player is hidden on mobile so tool pages are not covered', async () => {
  const source = await readFile(file('components/FloatingPlayer.tsx'), 'utf8');

  assert.match(source, /hidden md:block fixed bottom-6 right-6/);
  assert.match(source, /pathname === '\/'/);
});

test('camera OCR mobile flow keeps native picker primary and recognition controls reachable', async () => {
  const source = await readFile(file('app/tools/camera-ocr/CameraOcrPageClient.tsx'), 'utf8');

  assert.match(source, /使用系统相机\/相册/);
  assert.match(source, /md:hidden/);
  assert.match(source, /sticky bottom-0/);
  assert.match(source, /env\(safe-area-inset-bottom\)/);
  assert.match(source, /max-h-\[52svh\]/);
  assert.match(source, /overflow-y-auto/);
});

test('camera OCR page enables low power chrome while it is open', async () => {
  const cameraSource = await readFile(file('app/tools/camera-ocr/CameraOcrPageClient.tsx'), 'utf8');
  const chromeSource = await readFile(file('components/PublicChrome.tsx'), 'utf8');

  assert.match(cameraSource, /camera-ocr-low-power/);
  assert.match(cameraSource, /classList\.add\('camera-ocr-low-power'\)/);
  assert.match(cameraSource, /classList\.remove\('camera-ocr-low-power'\)/);
  assert.match(chromeSource, /pathname\.startsWith\('\/tools\/camera-ocr'\)/);
  assert.match(chromeSource, /return null/);
});

test('camera OCR image preview reports preview failures without entering camera mode', async () => {
  const source = await readFile(file('app/tools/camera-ocr/CameraOcrPageClient.tsx'), 'utf8');

  assert.match(source, /handlePhotoPreviewError/);
  assert.match(source, /onError=\{handlePhotoPreviewError\}/);
  assert.doesNotMatch(source, /图片加载失败[\s\S]*openCamera/);
});
