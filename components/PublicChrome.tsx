'use client';

import { usePathname } from 'next/navigation';
import AnnouncementBanner from './AnnouncementBanner';
import AnnouncementPopup from './AnnouncementPopup';
import ClickEffect from './ClickEffect';
import CyberCat from './CyberCat';
import FloatingPlayer from './FloatingPlayer';
import GlobalToolbox from './GlobalToolbox';

function useRouteFlags() {
  const pathname = usePathname();
  return {
    isAdminRoute: pathname.startsWith('/admin'),
    isStandaloneRoute: pathname === '/login',
    isCameraOcrRoute: pathname.startsWith('/tools/camera-ocr'),
  };
}

export function PublicAnnouncementBanner() {
  const { isAdminRoute, isStandaloneRoute } = useRouteFlags();
  if (isStandaloneRoute || isAdminRoute) return null;
  return <AnnouncementBanner />;
}

export function PublicOverlays() {
  const { isAdminRoute, isStandaloneRoute, isCameraOcrRoute } = useRouteFlags();
  if (isAdminRoute || isStandaloneRoute || isCameraOcrRoute) return null;

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
