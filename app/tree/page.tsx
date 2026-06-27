import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 引入前台客户端组件
import CreativeWorkshopClient from './CreativeWorkshopClient';

export const metadata: Metadata = {
  title: '创意工坊 - y悠悠',
  description: '创意工坊，汇集文章、碎片记录与动态的综合展示空间',
};

type TreeContentType = 'post' | 'chatter' | 'moment';

type TreeContentItem = {
  id: string | number;
  slug: string;
  title: string;
  type: TreeContentType;
  date: string;
  cover: string | null;
  content: string;
};

type TreeContentMetadata = {
  id?: string | number;
  title?: string;
  date?: string | Date;
  cover?: string;
  image?: string;
};

function getLocalItems(directoryName: string, typeName: TreeContentType): TreeContentItem[] {
  const dirPath = path.join('/opt/xhblogs', directoryName);
  let items: TreeContentItem[] = [];
  try {
    if (fs.existsSync(dirPath)) {
      const fileNames = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      items = fileNames.map(fileName => {
        const fullPath = path.join(dirPath, fileName);
        // 🌟 核心：把 content（正文内容）和 data（头部参数）解构出来！
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const metadata = data as TreeContentMetadata;

        // 提取真正的文件名作为路由 slug
        const realSlug = fileName.replace(/\.md$/, '');
        const date = metadata.date instanceof Date
          ? metadata.date.toISOString().split('T')[0]
          : typeof metadata.date === 'string'
            ? metadata.date
            : '2026-05-01';
        const cover = typeof metadata.cover === 'string'
          ? metadata.cover
          : typeof metadata.image === 'string'
            ? metadata.image
            : null;

        return {
          id: metadata.id ?? realSlug,
          slug: realSlug, // 🌟 强制保留真实的 slug 供路由跳转使用
          title: typeof metadata.title === 'string' ? metadata.title : '',
          type: typeName,
          date,
          // 🌟 核心修复：把 cover（封面图）提取出来传给前台！如果写的是 image 也兼容
          cover,
          // 把正文传给前台，去掉可能存在的换行符，限制长度防止卡片撑爆
          content: content.trim()
        };
      });
    }
  } catch (error) {
    console.error(`读取 ${directoryName} 失败:`, error);
  }
  return items;
}

export default function CreativeWorkshopPage() {
  const posts = getLocalItems('posts', 'post');
  const chatters = getLocalItems('chatters', 'chatter');
  const moments = getLocalItems('moments', 'moment');

  return (
    <CreativeWorkshopClient
      posts={posts}
      chatters={chatters}
      moments={moments}
    />
  );
}
