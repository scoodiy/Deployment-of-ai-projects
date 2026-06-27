'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { MusicProvider } from './MusicProvider';

export default function RouteAwareMusicProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return <>{children}</>;
  return <MusicProvider>{children}</MusicProvider>;
}
