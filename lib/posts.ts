import { getDb } from './db';
import { siteConfig } from '../siteConfig';

export interface PublishedPost {
  id: number;
  slug: string;
  title: string;
  description: string;
  cover: string;
  date: string;
  formattedDate: string;
  category: string;
  tags: string[];
  view_count: number;
}

function formatUpdateTime(dateString: string): string {
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
  } catch {
    return dateString;
  }
}

function parseTags(rawTags: string | null | undefined): string[] {
  if (!rawTags) return ['未分类'];
  try {
    const parsed = JSON.parse(rawTags);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['未分类'];
  } catch {
    return ['未分类'];
  }
}

/**
 * 统一获取已发布文章列表
 * 全站所有页面必须使用此方法获取文章数据，确保数据源一致
 */
export function getPublishedPosts(): PublishedPost[] {
  try {
    const db = getDb();
    const blogs = db.prepare(
      "SELECT id, title, slug, summary, cover_image, category, tags, view_count, published_at FROM blogs WHERE status = 'published' ORDER BY published_at DESC"
    ).all() as any[];

    return blogs.map((blog: any) => ({
      id: blog.id,
      slug: blog.slug,
      title: blog.title || '',
      description: blog.summary || '',
      cover: blog.cover_image || siteConfig.defaultPostCover,
      date: blog.published_at || '1970-01-01',
      formattedDate: formatUpdateTime(blog.published_at),
      category: blog.category || '',
      tags: parseTags(blog.tags),
      view_count: blog.view_count || 0,
    }));
  } catch (e) {
    console.error('获取文章列表失败:', e);
    return [];
  }
}

/**
 * 根据 slug 获取单篇文章
 */
export function getPostBySlug(slug: string) {
  try {
    const db = getDb();
    const blog = db.prepare(
      "SELECT * FROM blogs WHERE slug = ? AND status = 'published'"
    ).get(slug) as any;

    if (!blog) return null;

    let tags: string[] = [];
    try { tags = JSON.parse(blog.tags || '[]'); } catch { tags = []; }

    return {
      id: blog.id,
      slug: blog.slug,
      title: blog.title || '',
      content: blog.content || '',
      description: blog.summary || '',
      cover: blog.cover_image || siteConfig.defaultPostCover,
      date: blog.published_at || blog.created_at || '1970-01-01',
      category: blog.category || '',
      tags,
      view_count: blog.view_count || 0,
    };
  } catch (e) {
    console.error(`获取文章 ${slug} 失败:`, e);
    return null;
  }
}
