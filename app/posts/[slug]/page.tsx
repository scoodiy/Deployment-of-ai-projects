import Link from 'next/link';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import 'highlight.js/styles/atom-one-dark.css';

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { siteConfig } from '../../../siteConfig';
import ClientSocials from '../../../components/ClientSocials';
import ClientTOC from '../../../components/ClientTOC';
import BackButton from '../../../components/BackButton';
import PostComments from '../../../components/PostComments';
import SidebarLyric from '../../../components/SidebarLyric';
import { getDb } from '../../../lib/db';

export async function generateStaticParams() {
  try {
    const db = getDb();
    const blogs = db.prepare("SELECT slug FROM blogs WHERE status = 'published'").all() as any[];
    return blogs.map((b: any) => ({ slug: b.slug }));
  } catch (e) {
    return [];
  }
}

function extractToc(content: string) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    toc.push({
      level: match[1].length,
      text: match[2].trim(),
      id: match[2].trim().toLowerCase().replace(/\s+/g, '-')
    });
  }
  return toc;
}

async function getPostData(slug: string) {
  const db = getDb();
  const blog = db.prepare(
    "SELECT * FROM blogs WHERE slug = ? AND status = 'published'"
  ).get(slug) as any;

  if (!blog) {
    return { slug, contentHtml: '', toc: [], title: '文章不存在', date: '', tags: [], cover: siteConfig.defaultPostCover };
  }

  let content = blog.content || '';

  // 前台渲染清洗
  content = content.replace(/^(\s*\d+)\.([^ \n])/gm, '$1. $2');
  content = content.replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '');

  const blocks = content.split(/(```[\s\S]*?```)/g);
  content = blocks.map((block: string, index: number) => {
    if (index % 2 === 1) return block;
    return block.replace(/\n{3,}/g, (match: string) => {
      const brCount = match.length - 2;
      return '\n\n' + '<br/>'.repeat(brCount) + '\n\n';
    });
  }).join('');

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    // @ts-ignore
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
      subset: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'go', 'rust', 'bash', 'json', 'html', 'css', 'sql', 'xml']
    })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  let tags: string[] = [];
  try { tags = JSON.parse(blog.tags || '[]'); } catch { tags = []; }

  return {
    slug,
    contentHtml: processedContent.toString(),
    toc: extractToc(content),
    title: blog.title,
    date: blog.published_at || blog.created_at,
    tags,
    cover: blog.cover_image || siteConfig.defaultPostCover
  };
}

function getRecentPosts(currentSlug: string) {
  try {
    const db = getDb();
    const blogs = db.prepare(
      "SELECT slug, title, published_at as date FROM blogs WHERE status = 'published' AND slug != ? ORDER BY published_at DESC LIMIT 3"
    ).all(currentSlug) as any[];
    return blogs;
  } catch (e) {
    return [];
  }
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const postData = await getPostData(resolvedParams.slug);
  const recentPosts = getRecentPosts(resolvedParams.slug);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 flex flex-col lg:flex-row gap-6 md:gap-8 relative z-10">

          <article className="flex-1 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 relative group">
              <img src={postData.cover} alt="封面" className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" />
            </div>

            <div className="p-5 md:p-12 relative">
              <BackButton />

              <header className="mb-6 md:mb-8 border-b border-slate-300/50 dark:border-slate-700 pb-5 md:pb-6 relative">
                <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors duration-700 pr-16 md:pr-24 leading-snug">
                  {postData.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 md:gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-white/30 dark:bg-slate-900/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full w-max text-xs md:text-sm transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    写作时间：{postData.date}
                  </div>

                  {postData.tags.map((tag: string) => (
                    <div key={tag} className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-bold bg-white/30 dark:bg-slate-900/50 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm transition-colors duration-700 shadow-sm border border-white/20 dark:border-white/5">
                      # {tag}
                    </div>
                  ))}
                </div>
              </header>

              <div
                className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
                  prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
                  prose-h1:text-2xl md:prose-h1:text-3xl prose-h1:mb-4
                  prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-700 prose-h2:pb-2
                  prose-h3:text-lg md:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
                  prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                  prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-2xl prose-img:shadow-xl
                  prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50 dark:prose-blockquote:bg-indigo-900/20 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                  prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-pink-50 dark:prose-code:bg-pink-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-[#282c34] prose-pre:rounded-2xl prose-pre:shadow-xl prose-pre:border prose-pre:border-slate-700
                  prose-strong:text-slate-900 dark:prose-strong:text-white
                  prose-table:rounded-xl prose-table:overflow-hidden prose-table:shadow-lg
                  prose-th:bg-indigo-50 dark:prose-th:bg-indigo-900/30 prose-th:p-3 prose-th:font-black
                  prose-td:p-3
                  transition-colors duration-700"
                dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
              />

              <div className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
                <ClientSocials />
              </div>

              <div className="mt-10 md:mt-16">
                <PostComments slug={resolvedParams.slug} />
              </div>
            </div>
          </article>

          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-6">
            <div className="sticky top-24">
              <ClientTOC toc={postData.toc} />
              <div className="mt-6">
                <SidebarLyric />
              </div>

              {recentPosts.length > 0 && (
                <div className="mt-6 bg-white/40 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/40 dark:border-white/10">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">最新文章</h4>
                  <div className="space-y-3">
                    {recentPosts.map((p: any) => (
                      <Link key={p.slug} href={`/posts/${p.slug}`} className="block group">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {p.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.date}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}
