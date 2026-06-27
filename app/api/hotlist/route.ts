import { NextRequest, NextResponse } from 'next/server';

interface HotItem {
  title: string;
  url: string;
  hot: number | string;
  desc?: string;
  source?: string;
}

interface BilibiliItem {
  show_name?: string;
  keyword?: string;
  heat_score?: number;
}

interface HotSource {
  title: string;
  data: HotItem[];
}

const UA = 'Mozilla/5.0 (compatible; xhblogs-hotlist/1.0)';

async function fetchWeiboHot(): Promise<HotSource | null> {
  try {
    const res = await fetch('https://weibo.com/ajax/side/hotSearch', {
      headers: { 'User-Agent': UA, 'Referer': 'https://weibo.com' },
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    if (!json.ok || !json.data?.realtime) return null;

    const items: HotItem[] = [];
    for (const item of json.data.realtime.slice(0, 50)) {
      const word = item.word || item.word_scheme || '';
      items.push({
        title: word.replace(/^#|#$/g, ''),
        url: item.word_scheme
          ? `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word_scheme)}`
          : `https://s.weibo.com/weibo?q=${encodeURIComponent(word)}`,
        hot: item.num || item.raw_hot || 0,
        desc: item.note || '',
      });
    }
    return { title: '微博热搜', data: items };
  } catch (e) {
    console.error('Weibo hotlist error:', e);
    return null;
  }
}

async function fetchBilibiliHot(): Promise<HotSource | null> {
  try {
    const res = await fetch('https://api.bilibili.com/x/web-interface/search/square?limit=50', {
      headers: { 'User-Agent': UA, 'Referer': 'https://www.bilibili.com' },
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    if (json.code !== 0 || !json.data?.trending?.list) return null;

    const items: HotItem[] = json.data.trending.list.map((item: BilibiliItem) => ({
      title: item.show_name || item.keyword || '',
      url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(item.keyword || item.show_name || '')}`,
      hot: item.heat_score || 0,
    }));
    return { title: 'B站热搜', data: items };
  } catch (e) {
    console.error('Bilibili hotlist error:', e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  try {
    const results = await Promise.allSettled([fetchWeiboHot(), fetchBilibiliHot()]);
    const sources: HotSource[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        sources.push(r.value);
      }
    }

    if (sources.length === 0) {
      return NextResponse.json({ error: '无法获取热榜数据' }, { status: 502 });
    }

    if (type !== 'all') {
      const filtered = sources.filter(s => s.title.includes(type) || type.includes(s.title));
      return NextResponse.json({ success: true, data: filtered });
    }

    return NextResponse.json({ success: true, data: sources });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'hotlist api error' }, { status: 502 });
  }
}
