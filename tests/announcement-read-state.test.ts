import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const file = (path: string) => new URL(`../${path}`, import.meta.url);

test('homepage announcement popup marks the current announcement as read when closed', async () => {
  const popup = await readFile(file('components/AnnouncementPopup.tsx'), 'utf8');

  assert.match(popup, /announcement_read_ids/);
  assert.match(popup, /const markAnnouncementRead = /);
  assert.match(popup, /const handleClose = \(\) => \{\s*markAnnouncementRead\(announcement\.id\);/s);
  assert.match(popup, /const handleNeverShow = \(\) => \{\s*markAnnouncementRead\(announcement\.id\);/s);
});

test('homepage announcement banner shares read state and records reading after expansion', async () => {
  const banner = await readFile(file('components/AnnouncementBanner.tsx'), 'utf8');

  assert.match(banner, /announcement_read_ids/);
  assert.doesNotMatch(banner, /announcement_dismissed_\$\{announcement\.id\}/);
  assert.match(banner, /const markAnnouncementRead = /);
  assert.match(banner, /const handleToggleExpanded = \(\) => \{/);
  assert.match(banner, /markAnnouncementRead\(announcement\.id\);/);
});

test('navbar announcement badge only counts unread announcements after the panel is opened', async () => {
  const navbar = await readFile(file('components/Navbar.tsx'), 'utf8');

  assert.match(navbar, /announcement_read_ids/);
  assert.match(navbar, /const \[readAnnouncementIds, setReadAnnouncementIds\] = useState<number\[\]>\(\[\]\);/);
  assert.match(navbar, /const unreadAnnouncements = announcements\.filter/);
  assert.match(navbar, /const handleAnnouncementsToggle = \(\) => \{/);
  assert.match(navbar, /setReadAnnouncementIds\(nextReadIds\);/);
  assert.match(navbar, /unreadAnnouncements\.length > 0/);
});
