import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const file = (path: string) => new URL(`../${path}`, import.meta.url);

test('admin shell uses dark grouped sidebar and light workspace', async () => {
  const layout = await readFile(file('app/admin/layout.tsx'), 'utf8');

  assert.match(layout, /const menuGroups = \[/);
  assert.match(layout, /bg-slate-950/);
  assert.match(layout, /bg-slate-100/);
  assert.match(layout, /访问前台/);
  assert.doesNotMatch(layout, /bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900/);
});

test('shared admin ui components exist for first phase pages', async () => {
  const ui = await readFile(file('components/admin/AdminUI.tsx'), 'utf8');

  assert.match(ui, /export function AdminPageHeader/);
  assert.match(ui, /export function AdminCard/);
  assert.match(ui, /export function AdminToolbar/);
  assert.match(ui, /export function StatusBadge/);
  assert.match(ui, /export function ActionButton/);
});

test('dashboard, blogs, images, and users pages use shared admin surfaces', async () => {
  const dashboard = await readFile(file('app/admin/dashboard/page.tsx'), 'utf8');
  const blogs = await readFile(file('app/admin/blogs/page.tsx'), 'utf8');
  const images = await readFile(file('app/admin/images/page.tsx'), 'utf8');
  const users = await readFile(file('app/admin/users/page.tsx'), 'utf8');

  for (const source of [dashboard, blogs, images, users]) {
    assert.match(source, /AdminPageHeader/);
    assert.match(source, /AdminCard/);
  }

  assert.match(blogs, /StatusBadge/);
  assert.match(users, /StatusBadge/);
  assert.match(images, /onError=\{\(event\) =>/);
  assert.match(images, /图片加载失败/);
});

test('public floating chrome is gated away from admin routes', async () => {
  const layout = await readFile(file('app/layout.tsx'), 'utf8');
  const publicChrome = await readFile(file('components/PublicChrome.tsx'), 'utf8');
  const routeAwareMusicProvider = await readFile(file('components/RouteAwareMusicProvider.tsx'), 'utf8');

  assert.match(layout, /PublicAnnouncementBanner/);
  assert.match(layout, /PublicOverlays/);
  assert.match(layout, /RouteAwareMusicProvider/);
  assert.doesNotMatch(layout, /<MusicProvider>/);
  assert.doesNotMatch(layout, /<FloatingPlayer \/>/);
  assert.doesNotMatch(layout, /<GlobalToolbox \/>/);
  assert.doesNotMatch(layout, /<CyberCat \/>/);
  assert.match(publicChrome, /pathname\.startsWith\('\/admin'\)/);
  assert.match(publicChrome, /return null/);
  assert.match(routeAwareMusicProvider, /pathname\.startsWith\('\/admin'\)/);
  assert.match(routeAwareMusicProvider, /return <>\{children\}<\/>/);
});
