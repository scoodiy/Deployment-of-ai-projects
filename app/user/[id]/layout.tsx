import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `用户 ${id} - y悠悠`,
    description: '查看用户个人主页',
    robots: { index: false, follow: false },
  };
}

export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
