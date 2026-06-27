"use client";

import Link from 'next/link';
import { FileText } from 'lucide-react';

type Post = {
  slug: string;
  title: string;
  description: string;
  cover: string;
  formattedDate?: string;
  category?: string;
};

function getPostHref(slug: string) {
  return !slug || slug === 'none' || /^\d+$/.test(slug) ? '/timeline' : `/posts/${slug}`;
}

export default function LatestPostsCarousel({ posts }: { posts: Post[] }) {
  const latestPosts = posts.slice(0, 4);

  if (latestPosts.length === 0) return null;

  return (
    <section className="home-surface h-full p-5 md:p-6" aria-labelledby="latest-posts-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[var(--home-accent)]">RECENT WRITING</p>
          <h2 id="latest-posts-title" className="mt-1 text-xl font-bold text-[var(--home-text)] dark:text-slate-100">最新文章</h2>
        </div>
        <Link href="/timeline" className="text-sm text-[var(--home-accent)] transition-colors hover:text-slate-900 dark:hover:text-white">
          查看全部
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {latestPosts.map((post) => (
          <Link
            key={post.slug}
            href={getPostHref(post.slug)}
            className="group overflow-hidden border border-[var(--home-border)] bg-white/70 transition-colors hover:border-[var(--home-accent)] dark:bg-slate-900/40"
          >
            {post.slug !== 'none' && post.cover ? (
              <img
                  src={post.cover}
                  alt={post.title}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center border-b border-[var(--home-border)] bg-[var(--home-bg)] text-[var(--home-accent)]">
                <FileText className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--home-muted)] dark:text-slate-400">
                <span>{post.formattedDate || '刚刚更新'}</span>
                {post.category && <span className="truncate">{post.category}</span>}
              </div>
              <h3 className="line-clamp-1 text-base font-bold text-[var(--home-text)] dark:text-slate-100">{post.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--home-muted)] dark:text-slate-400">{post.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
