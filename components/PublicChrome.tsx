'use client';

import { usePathname } from 'next/navigation';
import AnnouncementBanner from './AnnouncementBanner';
import AnnouncementPopup from './AnnouncementPopup';
import ClickEffect from './ClickEffect';
import CyberCat from './CyberCat';
import FloatingPlayer from './FloatingPlayer';
import GlobalToolbox from './GlobalToolbox';

function useIsAdminRoute() {
  const pathname = usePathname();
  return pathname.startsWith('/admin');
}

function useIsStandaloneRoute() {
  const pathname = usePathname();
  return pathname === '/login';
}

export function PublicAnnouncementBanner() {
  if (useIsStandaloneRoute()) return null;
  if (useIsAdminRoute()) return null;
  return <AnnouncementBanner />;
}

export function PublicOverlays() {
  const pathname = usePathname();
  if (useIsAdminRoute()) return null;
  if (useIsStandaloneRoute()) return null;
  if (pathname.startsWith('/tools/camera-ocr')) return null;

  return (
    <>
      <FloatingPlayer />
      <GlobalToolbox />
      <ClickEffect />
      <AnnouncementPopup />
      <CyberCat />
    </>
  );
}
