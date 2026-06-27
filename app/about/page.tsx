import { getSiteConfig } from '../../lib/site-config';
import AboutClient from './AboutClient';

export const metadata = {
  title: "关于",
};

export default function AboutPage() {
  const dbConfig = getSiteConfig();

  let danmakuCount = 0;
  try { danmakuCount = JSON.parse(dbConfig.danmaku_list || '[]').length; } catch {}

  const profile = {
    name: dbConfig.site_title,
    bio: dbConfig.about_content,
    avatar: dbConfig.avatar_url,
    social: {
      github: dbConfig.github_url,
      gitee: dbConfig.gitee_url,
      email: dbConfig.email,
      qq: dbConfig.qq,
      wechat: dbConfig.wechat,
      bilibili: dbConfig.bilibili_url,
    },
    danmakuCount,
  };

  return <AboutClient profile={profile} />;
}
