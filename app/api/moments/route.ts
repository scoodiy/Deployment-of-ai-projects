import fs from 'fs';
import matter from 'gray-matter';
import { NextResponse } from 'next/server';

interface MomentData {
  id: string;
  date: string;
  location: string;
  images: string[];
  content: string;
}

const DATA_DIRS = [
  '/opt/xhblogs/posts/moments',
  '/opt/xhblogs/moments',
];

function readMoments(): MomentData[] {
  const moments: MomentData[] = [];

  for (const dir of DATA_DIRS) {
    if (!fs.existsSync(/* turbopackIgnore: true */ dir)) continue;

    const fileNames = fs
      .readdirSync(/* turbopackIgnore: true */ dir)
      .filter((fileName) => fileName.endsWith('.md'));
    for (const fileName of fileNames) {
      const fullPath = `${dir}/${fileName}`;
      const { data, content } = matter(fs.readFileSync(/* turbopackIgnore: true */ fullPath, 'utf8'));

      moments.push({
        id: fileName.replace(/\.md$/, ''),
        date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date || '1970-01-01',
        location: typeof data.location === 'string' ? data.location : '',
        images: Array.isArray(data.images) ? data.images : [],
        content: content.trim(),
      });
    }
  }

  return Array.from(new Map(moments.map((item) => [item.id, item])).values());
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: readMoments(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '读取说说数据失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
