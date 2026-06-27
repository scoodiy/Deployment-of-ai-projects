"use client";

import { usePathname } from 'next/navigation';
import SiteComments from './SiteComments';

export default function Comments() {
  const pathname = usePathname();
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  const targetId = cleanPath === '/' ? 'home' : cleanPath;

  return (
    <div className="w-full mt-16 relative">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>
      <div className="relative z-10 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
        <SiteComments targetType="page" targetId={targetId} />
      </div>
    </div>
  );
}
