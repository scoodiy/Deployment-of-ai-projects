import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ToolPageClient from '../ToolPageClient';
import { getToolBySlug, TOOL_CATALOG } from '../toolCatalog';

interface ToolPageProps {
  params: Promise<{ tool: string }>;
}

const STATIC_TOOL_ROUTES = new Set(['camera-ocr', 'daily-stock', 'stock-analysis', 'market-review']);

export function generateStaticParams() {
  return TOOL_CATALOG
    .filter((tool) => !STATIC_TOOL_ROUTES.has(tool.slug))
    .map((tool) => ({ tool: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: '工具不存在 | y悠悠',
    };
  }

  return {
    title: `${tool.name} | 工具箱 | y悠悠`,
    description: tool.desc,
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool: slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  if (tool.slug !== slug) {
    redirect(tool.href);
  }

  return <ToolPageClient slug={slug} />;
}
