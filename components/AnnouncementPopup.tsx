'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  is_important: number;
  version: number;
  display_scope: string;
}

const ANNOUNCEMENT_READ_KEY = 'announcement_read_ids';
const LEGACY_POPUP_DISMISSED_KEY = 'announcement_dismissed_ids';

function isHomepage(pathname: string) {
  return pathname === '/' || pathname === '/zh' || pathname === '/en' || /^\/\w{2}$/.test(pathname);
}

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  const getReadAnnouncementIds = () => {
    try {
      const readIds = JSON.parse(localStorage.getItem(ANNOUNCEMENT_READ_KEY) || '[]') as number[];
      const legacyDismissedIds = JSON.parse(localStorage.getItem(LEGACY_POPUP_DISMISSED_KEY) || '[]') as number[];
      return Array.from(new Set([...readIds, ...legacyDismissedIds]));
    } catch {
      return [];
    }
  };

  const markAnnouncementRead = (id: number) => {
    const readIds = getReadAnnouncementIds();
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem(ANNOUNCEMENT_READ_KEY, JSON.stringify(readIds));
    }
  };

  const isAnnouncementRead = (id: number) => {
    return getReadAnnouncementIds().includes(id);
  };

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        const list: Announcement[] = (data.announcements || []).filter((a: Announcement) => {
          if (a.display_scope === 'homepage_only' && !isHomepage(pathname)) return false;
          return true;
        });
        const important = list.find(a => a.is_important);
        if (!important) return;

        if (isAnnouncementRead(important.id)) return;

        setAnnouncement(important);
        setShow(true);
      })
      .catch(() => {});
  }, [pathname]);

  if (!announcement || !show) return null;

  const handleClose = () => {
    markAnnouncementRead(announcement.id);
    setShow(false);
  };

  const handleNeverShow = () => {
    markAnnouncementRead(announcement.id);
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-[90%] mx-4 overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span>🔔</span> {announcement.title}
          </h3>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {announcement.content.split('\n').map((line, i) => (
              <p key={i} className="my-1.5">{line}</p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <button
            onClick={handleNeverShow}
            className="px-4 min-h-[44px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm"
          >
            不再提示
          </button>
          <button
            onClick={handleClose}
            className="px-6 min-h-[44px] bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
