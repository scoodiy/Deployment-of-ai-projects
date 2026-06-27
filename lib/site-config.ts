import { getDb } from './db';

export interface SiteConfig {
  site_title: string;
  site_subtitle: string;
  hero_title: string;
  hero_subtitle: string;
  hero_background_image: string;
  announcement: string;
  show_ai_assistant: boolean;
  show_tools: boolean;
  show_games: boolean;
  show_blog: boolean;
  show_about: boolean;
  show_music: boolean;
  show_announcement: boolean;
  about_title: string;
  about_content: string;
  avatar_url: string;
  github_url: string;
  gitee_url: string;
  email: string;
  qq: string;
  wechat: string;
  bilibili_url: string;
  custom_links: string;
  danmaku_list: string;
  comments_need_approval: boolean;
}

const defaultConfig: SiteConfig = {
  site_title: 'y悠悠',
  site_subtitle: '的宝藏之地',
  hero_title: '欢迎来到y悠悠的宝藏之地',
  hero_subtitle: '代码、学术与生活的碎片记录',
  hero_background_image: '',
  announcement: '',
  show_ai_assistant: true,
  show_tools: true,
  show_games: true,
  show_blog: true,
  show_about: true,
  show_music: true,
  show_announcement: false,
  about_title: '关于我',
  about_content: '',
  avatar_url: '',
  github_url: '',
  gitee_url: '',
  email: '',
  qq: '',
  wechat: '',
  bilibili_url: '',
  custom_links: '[]',
  danmaku_list: '[]',
  comments_need_approval: false,
};

export function getSiteConfig(): SiteConfig {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT config_key, config_value FROM site_config').all() as {
      config_key: string;
      config_value: string;
    }[];

    const config = { ...defaultConfig };
    for (const row of rows) {
      const key = row.config_key as keyof SiteConfig;
      if (key in config) {
        if (typeof config[key] === 'boolean') {
          (config as Record<string, unknown>)[key] = row.config_value === 'true';
        } else {
          (config as Record<string, unknown>)[key] = row.config_value;
        }
      }
    }
    return config;
  } catch (error) {
    console.error('Failed to load site config from DB:', error);
    return defaultConfig;
  }
}
