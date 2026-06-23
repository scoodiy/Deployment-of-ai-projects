const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS = 5;

const submissionTimes = new Map<number, number[]>();

export function consumeCommentSubmission(userId: number, now = Date.now()) {
  const activeTimes = (submissionTimes.get(userId) ?? []).filter((time) => now - time < WINDOW_MS);
  if (activeTimes.length >= MAX_SUBMISSIONS) {
    submissionTimes.set(userId, activeTimes);
    return false;
  }

  activeTimes.push(now);
  submissionTimes.set(userId, activeTimes);
  return true;
}

export function resetCommentSubmissionLimits() {
  submissionTimes.clear();
}
