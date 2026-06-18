import { siteConfig } from '../../siteConfig';
import { getSiteConfig } from '../../lib/site-config';
import AboutClient from './AboutClient';

export const metadata = {
  title: "关于 | " + siteConfig.title,
};

export default function AboutPage() {
  const dbConfig = getSiteConfig();

  const profile = {
    name: dbConfig.site_title || siteConfig.authorName,
    bio: dbConfig.about_content || siteConfig.bio,
    avatar: siteConfig.avatarUrl,
    social: siteConfig.social,
    buildDate: siteConfig.buildDate,
  };

  return <AboutClient profile={profile} />;
}
