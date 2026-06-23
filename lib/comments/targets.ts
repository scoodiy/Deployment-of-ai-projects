export const COMMENT_TARGET_TYPES = [
  'blog',
  'media',
  'music',
  'friend',
  'project',
  'chatter',
  'moment',
  'lab',
] as const;

export type CommentTargetType = typeof COMMENT_TARGET_TYPES[number];

const TARGET_KEY_PATTERN = /^[a-zA-Z0-9:_-]+$/;

export function parseCommentTarget(type: unknown, key: unknown): { type: CommentTargetType; key: string } {
  if (typeof type !== 'string' || !COMMENT_TARGET_TYPES.includes(type as CommentTargetType)) {
    throw new Error('无效的评论目标');
  }

  if (typeof key !== 'string' || key.length < 1 || key.length > 128 || !TARGET_KEY_PATTERN.test(key)) {
    throw new Error('无效的评论目标键');
  }

  return { type: type as CommentTargetType, key };
}
