import { siteConfig } from '../../siteConfig';
import { getSiteConfig } from '../../lib/site-config';
import AboutClient from './AboutClient';

export const metadata = {
  title: "关于 | " + siteConfig.title,
};

export default function AboutPage() {
  const dbConfig = getSiteConfig();

  let danmakuCount = 0;
  try { danmakuCount = JSON.parse(dbConfig.danmaku_list || '[]').length; } catch {}

  const profile = {
    name: dbConfig.site_title || siteConfig.authorName,
    bio: dbConfig.about_content || siteConfig.bio,
    avatar: dbConfig.avatar_url || siteConfig.avatarUrl,
    social: {
      github: dbConfig.github_url || siteConfig.social?.github,
      gitee: siteConfig.social?.gitee,
      email: dbConfig.email || siteConfig.social?.email,
      qq: dbConfig.qq || siteConfig.social?.qq,
      wechat: dbConfig.wechat || siteConfig.social?.wechat,
      bilibili: dbConfig.bilibili_url,
    },
    buildDate: siteConfig.buildDate,
    danmakuCount,
  };

  return <AboutClient profile={profile} />;
}
