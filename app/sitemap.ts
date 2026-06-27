import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { getDb } from '../lib/db';

interface BlogSitemapEntry {
  slug: string;
  published_at: string | null;
}

const BASE_URL = 'https://ayuu.fun';

function getDynamicRoutes(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  try {
    const db = getDb();
    const blogs = db.prepare(
      "SELECT slug, published_at FROM blogs WHERE status = 'published'"
    ).all() as BlogSitemapEntry[];

    for (const blog of blogs) {
      routes.push({
        url: `${BASE_URL}/posts/${blog.slug}`,
        lastModified: blog.published_at ? new Date(blog.published_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {}

  try {
    const chattersDir = path.join(process.cwd(), 'chatters');
    if (fs.existsSync(chattersDir)) {
      const files = fs.readdirSync(chattersDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const slug = file.replace(/\.md$/, '');
        routes.push({
          url: `${BASE_URL}/chatter/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch {}

  return routes;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${BASE_URL}/tools`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/ai`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/projects`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${BASE_URL}/timeline`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/tree`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${BASE_URL}/photowall`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${BASE_URL}/music`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/moments`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.6 },
    { url: `${BASE_URL}/friends`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  return [...staticPages, ...getDynamicRoutes()];
}
