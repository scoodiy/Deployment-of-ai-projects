"use client";

import SiteComments from './SiteComments';

export default function LabComments({ pageId }: { pageId?: string }) {
  return (
    <div className="w-full mt-16 relative">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>
      <div className="relative z-10 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
        <SiteComments targetType="workshop" targetId={pageId || ''} />
      </div>
    </div>
  );
}
