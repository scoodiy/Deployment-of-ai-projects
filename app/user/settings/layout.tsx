import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '个人设置 - y悠悠',
  description: '管理个人账户设置',
  robots: { index: false, follow: false },
};

export default function UserSettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
