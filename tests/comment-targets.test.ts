import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCommentTarget } from '../lib/comments/targets.ts';

test('accepts stable comment target types and keys', () => {
  assert.deepEqual(parseCommentTarget('blog', 'my-first-post'), { type: 'blog', key: 'my-first-post' });
  assert.deepEqual(parseCommentTarget('chatter', 'hello'), { type: 'chatter', key: 'hello' });
  assert.deepEqual(parseCommentTarget('moment', '2026-06-22'), { type: 'moment', key: '2026-06-22' });
  assert.deepEqual(parseCommentTarget('lab', 'workshop-2026-06'), { type: 'lab', key: 'workshop-2026-06' });
});

test('keeps existing numeric comment target types available', () => {
  assert.deepEqual(parseCommentTarget('music', '0'), { type: 'music', key: '0' });
  assert.deepEqual(parseCommentTarget('friend', '0'), { type: 'friend', key: '0' });
});

test('rejects unsupported, empty, and unsafe target keys', () => {
  assert.throws(() => parseCommentTarget('admin', '1'), /无效的评论目标/);
  assert.throws(() => parseCommentTarget('blog', ''), /无效的评论目标键/);
  assert.throws(() => parseCommentTarget('lab', '../escape'), /无效的评论目标键/);
  assert.throws(() => parseCommentTarget('lab', 'x'.repeat(129)), /无效的评论目标键/);
});
