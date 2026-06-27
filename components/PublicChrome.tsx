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

export function PublicAnnouncementBanner() {
  if (useIsAdminRoute()) return null;
  return <AnnouncementBanner />;
}

export function PublicOverlays() {
  if (useIsAdminRoute()) return null;

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
