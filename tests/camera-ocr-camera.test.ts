import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (...parts: string[]) => path.join(root, ...parts);

test('camera OCR falls back to a default camera stream when rear camera constraints fail', async () => {
  const source = await readFile(file('app/tools/camera-ocr/CameraOcrPageClient.tsx'), 'utf8');
  const getUserMediaCalls = source.match(/navigator\.mediaDevices\.getUserMedia/g) ?? [];

  assert.ok(getUserMediaCalls.length >= 2);
  assert.match(source, /video:\s*true/);
  assert.match(source, /console\.error\('Camera access failed'/);
});

test('camera OCR retries video playback from media readiness events instead of leaving a black preview', async () => {
  const source = await readFile(file('app/tools/camera-ocr/CameraOcrPageClient.tsx'), 'utf8');

  assert.match(source, /startVideoPreview/);
  assert.match(source, /onLoadedMetadata=\{\(\) => void startVideoPreview\(\)\}/);
  assert.match(source, /onCanPlay=\{\(\) => setIsVideoReady\(true\)\}/);
  assert.match(source, /onPlaying=\{\(\) => setIsVideoReady\(true\)\}/);
  assert.match(source, /videoNeedsTap/);
  assert.match(source, /点击激活预览/);
  assert.doesNotMatch(source, /videoRef\.current\.play\(\)\.catch\(\(\) => \{\}\)/);
});

test('camera OCR prevents taking a photo before the preview has a usable video frame', async () => {
  const source = await readFile(file('app/tools/camera-ocr/CameraOcrPageClient.tsx'), 'utf8');

  assert.match(source, /disabled=\{!isVideoReady\}/);
  assert.match(source, /videoNeedsTap \|\| !isVideoReady/);
  assert.match(source, /摄像头画面还没有准备好/);
  assert.match(source, /请先等预览画面出现/);
});

test('camera OCR offers a native camera or album fallback when live preview is unavailable', async () => {
  const source = await readFile(file('app/tools/camera-ocr/CameraOcrPageClient.tsx'), 'utf8');

  assert.match(source, /fileInputRef/);
  assert.match(source, /type="file"/);
  assert.match(source, /accept="image\/\*"/);
  assert.doesNotMatch(source, /capture="environment"/);
  assert.match(source, /handleImageFile/);
  assert.match(source, /使用系统相机\/相册/);
  assert.match(source, /onChange=\{handleImageFileChange\}/);
});

test('camera OCR native picker errors retry the picker instead of opening live camera preview', async () => {
  const source = await readFile(file('app/tools/camera-ocr/CameraOcrPageClient.tsx'), 'utf8');

  assert.match(source, /retryNativePicker/);
  assert.match(source, /onClick=\{retryNativePicker\}/);
  assert.doesNotMatch(source, /setState\('idle'\);\s*openCamera\(\);/);
});

test('camera OCR accepts mobile image files with missing mime type and normalizes data urls', async () => {
  const source = await readFile(file('app/tools/camera-ocr/CameraOcrPageClient.tsx'), 'utf8');

  assert.match(source, /function isSupportedImageFile/);
  assert.match(source, /function inferImageMime/);
  assert.match(source, /function normalizeImageDataUrl/);
  assert.match(source, /file\.type === ''/);
  assert.match(source, /image\/jpeg/);
  assert.match(source, /data:\$\{fallbackMime\};base64,/);
});
