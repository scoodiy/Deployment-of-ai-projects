import assert from 'node:assert/strict';
import test from 'node:test';
import { consumeCommentSubmission, resetCommentSubmissionLimits } from '../lib/comments/rate-limit.ts';

test('allows five comment submissions in a ten-minute window', () => {
  resetCommentSubmissionLimits();
  const now = 1_000_000;
  for (let index = 0; index < 5; index += 1) {
    assert.equal(consumeCommentSubmission(7, now + index), true);
  }
  assert.equal(consumeCommentSubmission(7, now + 5), false);
});

test('expires a user submission window after ten minutes', () => {
  resetCommentSubmissionLimits();
  const now = 1_000_000;
  assert.equal(consumeCommentSubmission(7, now), true);
  assert.equal(consumeCommentSubmission(7, now + 600_000), true);
});

test('tracks user submission windows independently', () => {
  resetCommentSubmissionLimits();
  const now = 1_000_000;
  for (let index = 0; index < 5; index += 1) {
    consumeCommentSubmission(7, now + index);
  }
  assert.equal(consumeCommentSubmission(8, now + 5), true);
});
