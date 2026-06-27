"use client";

import SiteComments from './SiteComments';

interface MomentCommentsProps {
  id: string;
}

export default function MomentComments({ id }: MomentCommentsProps) {
  const momentId = id.split('/').pop() || id;
  return <SiteComments targetType="moment" targetId={momentId} />;
}
