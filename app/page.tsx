import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import matter from 'gray-matter';

import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import SearchBar from '../components/SearchBar';
import { siteConfig } from '../siteConfig';
import { getSiteConfig } from '../lib/site-config';
import CloudPlayer from '../components/CloudPlayer';
import ThemeToggleBlock from '../components/ThemeToggleBlock';
import ProfileCard from '../components/ProfileCard';
import SiteDashboard from '../components/SiteDashboard';
import { albums } from '../data/albums';
import LyricBar from '../components/LyricBar';
import { ToastProvider } from '../components/ToastProvider';
import { getPublishedPosts } from '../lib/posts';

import LatestPostsCarousel from '../components/LatestPostsCarousel';
import LatestChatterCarousel from '../components/LatestChatterCarousel';

// 获取数据库配置
const dbConfig = getSiteConfig();

type Chatter = {
  slug: string;
  title: string;
  description: string;
  cover: string;
  date: string;
  formattedDate: string;
};

function formatUpdateTime(dateString: string) {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (hours === '00' && mins === '00') return `${year}.${month}.${day}`;
    return `${year}.${month}.${day} ${hours}:${mins}`;
  } catch { return dateString; }
}

export default function Home() {
  // 统一数据源：从数据库读取文章
  const allPosts = getPublishedPosts();
  const top5Posts = allPosts.length > 0 ? allPosts.slice(0, 5) : [{ slug: 'none', title: '暂无文章', description: '快去写第一篇吧！', cover: siteConfig.defaultPostCover, date: '', formattedDate: '', category: '', tags: [], view_count: 0 }];

  const chattersDirectory = path.join(process.cwd(), 'chatters');
  let allChatters: Chatter[] = [];
  try {
    if (fs.existsSync(chattersDirectory)) {
      const chatterFiles = fs.readdirSync(chattersDirectory).filter((f: string) => f.endsWith('.md'));
      allChatters = chatterFiles.map((fileName: string) => {
        const fullPath = path.join(chattersDirectory, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date instanceof Date
          ? data.date.toISOString().split('T')[0]
          : typeof data.date === 'string' ? data.date : '1970-01-01';
        const title = typeof data.title === 'string' ? data.title : '碎片记录';
        const description = typeof data.description === 'string' ? data.description : content.substring(0, 60);
        const cover = typeof data.cover === 'string'
          ? data.cover
          : 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop';
        return { slug: fileName.replace(/\.md$/, ''), title, description, cover, date: rawDate, formattedDate: formatUpdateTime(rawDate) };
      }).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.slug.localeCompare(a.slug);
      });
    }
  } catch {}
  const top5Chatters = allChatters.length > 0 ? allChatters.slice(0, 5) : [{ slug: 'none', title: '暂无记录', description: '记录一段思绪...', cover: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop', date: '', formattedDate: '' }];

  const publishedAlbums = albums.filter(a => !a.status || a.status === 'published');
  const chatterCount = allChatters.length;
  const realPhotoCount = publishedAlbums.reduce((total, album) => total + album.photos.length, 0);
  const latestAlbum = publishedAlbums.length > 0 ? publishedAlbums[0] : { id: '', title: '照片墙', description: '查看摄影', cover: siteConfig.photoWallImage, date: '' };

  return (
    <ToastProvider>
      <div className="min-h-screen pb-10">
        <Navbar />
        <PageTransition>
          <div className="mx-auto mt-24 w-full max-w-6xl px-4 sm:px-8">
            <SearchBar posts={allPosts} />

            <main className="flex w-full flex-col gap-5">
              {dbConfig.show_announcement && dbConfig.announcement && (
                <div className="border border-amber-300/50 bg-amber-50/80 px-5 py-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-700 dark:text-amber-300">公告</span>
                    <p className="text-sm">{dbConfig.announcement}</p>
                  </div>
                </div>
              )}

              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-4">
                  <ProfileCard postCount={allPosts.length} chatterCount={chatterCount} photoCount={realPhotoCount} />
                </div>
                <div className="lg:col-span-4">
                  <LatestChatterCarousel chatters={top5Chatters} />
                </div>
                <Link href="/photowall" className="home-surface group overflow-hidden lg:col-span-4">
                  <img
                    src={latestAlbum.cover}
                    alt={latestAlbum.title}
                    className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="border-t border-[var(--home-border)] p-5">
                    <p className="text-xs font-semibold text-[var(--home-accent)]">LATEST PHOTOS</p>
                    <h2 className="mt-1 text-xl font-bold text-[var(--home-text)] dark:text-slate-100">{latestAlbum.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--home-muted)] dark:text-slate-400">{latestAlbum.description}</p>
                  </div>
                </Link>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <div className="lg:col-span-8">
                  <LatestPostsCarousel posts={top5Posts} />
                </div>
                <div className="lg:col-span-4">
                  <CloudPlayer />
                </div>
              </section>

              <div className="w-full"><LyricBar /></div>

              <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                <Link href="/photowall" className="home-surface flex min-h-[180px] flex-col justify-between p-6 transition-colors lg:col-span-8">
                  <div>
                    <p className="text-xs font-semibold text-[var(--home-accent)]">PHOTO WALL</p>
                    <h2 className="mt-2 text-2xl font-bold text-[var(--home-text)] dark:text-slate-100">用照片留住当下</h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--home-muted)] dark:text-slate-400">从日常光影到远方风景，翻看 {realPhotoCount} 张已经收录的照片。</p>
                  </div>
                  <span className="mt-6 text-sm text-[var(--home-accent)]">进入照片墙</span>
                </Link>
                <div className="lg:col-span-4">
                  <ThemeToggleBlock />
                </div>
              </section>

              <div className="w-full"><SiteDashboard /></div>
            </main>
          </div>
        </PageTransition>
      </div>
    </ToastProvider>
  );
}
