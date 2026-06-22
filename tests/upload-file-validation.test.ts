import assert from 'node:assert/strict';
import test from 'node:test';

import { hasValidFileSignature } from '../lib/uploads/file-validation.ts';

test('accepts a PNG only when its binary signature matches the declared MIME type', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  assert.equal(hasValidFileSignature(png, 'image/png'), true);
  assert.equal(hasValidFileSignature(png, 'image/jpeg'), false);
});

test('rejects SVG text and non-image payloads declared as images', () => {
  assert.equal(hasValidFileSignature(Buffer.from('<svg onload="alert(1)" />'), 'image/svg+xml'), false);
  assert.equal(hasValidFileSignature(Buffer.from('not an image'), 'image/webp'), false);
});

test('accepts PDF only when its header is present', () => {
  assert.equal(hasValidFileSignature(Buffer.from('%PDF-1.7'), 'application/pdf'), true);
  assert.equal(hasValidFileSignature(Buffer.from('PDF-1.7'), 'application/pdf'), false);
});
