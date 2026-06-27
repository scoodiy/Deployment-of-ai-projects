'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  is_important: number;
  is_pinned: number;
  version: number;
  display_scope: string;
}

const ANNOUNCEMENT_READ_KEY = 'announcement_read_ids';
const LEGACY_POPUP_DISMISSED_KEY = 'announcement_dismissed_ids';

function isHomepage(pathname: string) {
  return pathname === '/' || pathname === '/zh' || pathname === '/en' || /^\/\w{2}$/.test(pathname);
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
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
    return getReadAnnouncementIds().includes(id) || localStorage.getItem(`announcement_dismissed_${id}`) === 'true';
  };

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        const list = (data.announcements || []).filter((a: Announcement) => {
          if (a.display_scope === 'homepage_only' && !isHomepage(pathname)) return false;
          return true;
        });
        const featured = list.find((a: Announcement) => a.is_pinned && !a.is_important);
        if (featured) {
          if (isAnnouncementRead(featured.id)) {
            setDismissed(true);
          } else {
            setAnnouncement(featured);
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (!announcement || dismissed) return null;

  const colorMap: Record<string, string> = {
    notice: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/50 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300',
    important: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-800/40 text-rose-700 dark:text-rose-300',
    maintenance: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/40 text-amber-700 dark:text-amber-300',
  };

  const iconMap: Record<string, string> = {
    notice: '📢',
    important: '🔔',
    maintenance: '🔧',
  };

  const colors = colorMap[announcement.type] || colorMap.notice;
  const icon = iconMap[announcement.type] || '📢';

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAnnouncementRead(announcement.id);
    setDismissed(true);
  };

  const handleToggleExpanded = () => {
    if (!expanded) {
      markAnnouncementRead(announcement.id);
    }
    setExpanded(!expanded);
  };

  return (
    <div className={`${colors} px-4 py-2.5 border-b flex items-center justify-between cursor-pointer relative z-50 backdrop-blur-sm`}
      onClick={handleToggleExpanded}
    >
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <span className="text-base">{icon}</span>
        <span className="font-medium text-sm md:text-base">{announcement.title}</span>
        <span className="text-xs opacity-60 hidden md:inline">点击{expanded ? '收起' : '展开'}</span>
        <span className="ml-auto text-xs opacity-50">▼</span>
      </div>
      <button onClick={handleDismiss} className="ml-4 min-w-[44px] min-h-[44px] flex items-center justify-center opacity-60 hover:opacity-100 text-lg font-bold flex-shrink-0 transition-opacity">
        ✕
      </button>
      {expanded && (
        <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-700 dark:text-slate-300 p-4 z-50 border-b border-gray-200 dark:border-gray-700 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-5xl mx-auto">
            {announcement.content.split('\n').map((line, i) => (
              <p key={i} className="text-sm my-1">{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
