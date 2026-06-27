"use client";

import SiteComments from './SiteComments';

export default function PostComments({ slug }: { slug: string }) {
  return <SiteComments targetType="blog" targetId={slug} />;
}
