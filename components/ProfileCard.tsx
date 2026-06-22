"use client";

import type { ReactNode } from 'react';
import { ExternalLink, GitBranch, Leaf, Mail, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSiteConfig } from './SiteConfigProvider';
import { useToast } from './ToastProvider';

type ProfileCardProps = {
  postCount: number;
  chatterCount: number;
  photoCount: number;
};

export default function ProfileCard({ postCount, chatterCount, photoCount }: ProfileCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const siteConfig = useSiteConfig();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label}已复制到剪贴板`, 'success');
  };

  return (
    <section
      onClick={() => router.push('/about')}
      className="home-surface flex h-full min-h-[300px] cursor-pointer flex-col p-6 transition-colors md:p-7"
      aria-label="个人资料，前往关于页面"
    >
      <div className="flex items-start gap-4">
        <img
          src={siteConfig.avatar_url || '/default-avatar.png'}
          alt={`${siteConfig.site_title}头像`}
          className="h-20 w-20 flex-none rounded-md border border-[var(--home-border)] object-cover bg-white"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--home-accent)]">LIFE JOURNAL</p>
          <h1 className="mt-1 truncate text-2xl font-bold text-[var(--home-text)] dark:text-slate-100">{siteConfig.site_title}</h1>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--home-muted)] dark:text-slate-400">{siteConfig.bio}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--home-border)] pt-5">
        <StatItem count={postCount} label="文章" />
        <StatItem count={chatterCount} label="日记" />
        <StatItem count={photoCount} label="照片" />
      </dl>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--home-border)] pt-5 text-xs text-[var(--home-muted)] dark:text-slate-400">
        <div className="flex min-w-0 items-center gap-2 truncate">
          <Leaf className="h-4 w-4 shrink-0 text-[var(--home-accent)]" aria-hidden="true" />
          <span>记录正在发生的生活</span>
        </div>
        <div className="flex shrink-0 gap-1" onClick={(event) => event.stopPropagation()}>
          <SocialButton label="GitHub" href={siteConfig.github_url} icon={<GitBranch className="h-4 w-4" />} />
          <SocialButton label="站外主页" href={siteConfig.bilibili_url} icon={<ExternalLink className="h-4 w-4" />} />
          <SocialButton label="复制邮箱" onClick={() => copyToClipboard(siteConfig.email || '', '邮箱')} icon={<Mail className="h-4 w-4" />} />
          <SocialButton label="复制 QQ" onClick={() => copyToClipboard(siteConfig.qq || '', 'QQ 号')} icon={<MessageCircle className="h-4 w-4" />} />
        </div>
      </div>
    </section>
  );
}

function StatItem({ count, label }: { count: number; label: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--home-muted)] dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-xl font-bold text-[var(--home-text)] dark:text-slate-100">{count}</dd>
    </div>
  );
}

type SocialButtonProps = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
};

function SocialButton({ label, icon, href, onClick }: SocialButtonProps) {
  const className = 'inline-flex h-8 w-8 items-center justify-center border border-[var(--home-border)] text-[var(--home-muted)] transition-colors hover:border-[var(--home-accent)] hover:text-[var(--home-accent)] dark:text-slate-400';

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className} title={label} aria-label={label}>{icon}</a>;
  }

  return <button type="button" onClick={onClick} className={className} title={label} aria-label={label}>{icon}</button>;
}
