import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
import { ToastProvider } from '../../components/ToastProvider';
import { getPublishedPosts } from '../../lib/posts';

export const metadata = {
  title: "文章 | " + siteConfig.title,
};

export default function Timeline() {
  const allPosts = getPublishedPosts();

  // 统计标签
  const tagCounts: Record<string, number> = {};
  const posts = allPosts.map(post => {
    const postTags = post.tags.length > 0 ? post.tags : ['未分类'];
    postTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    return {
      slug: post.slug,
      title: post.title || '无标题',
      date: post.date || '1970-01-01',
      description: post.description || '',
      tags: postTags,
      cover: post.cover,
    };
  });

  const tagsArray = Object.keys(tagCounts)
    .map(name => ({ name, count: tagCounts[name] }))
    .sort((a, b) => b.count - a.count);

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-32">
        <Navbar />
        <PageTransition>
          <TimelineClient posts={posts} tags={tagsArray} />
        </PageTransition>
      </div>
    </ToastProvider>
  );
}
