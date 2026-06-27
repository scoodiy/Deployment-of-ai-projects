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
  ai_api_url: string;
  ai_api_key: string;
  ai_model_id: string;
  ai_system_prompt: string;
  ai_max_output_tokens: string;
  ai_temperature: string;
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
  ai_api_url: 'https://text.pollinations.ai/openai',
  ai_api_key: '',
  ai_model_id: 'openai',
  ai_system_prompt: '你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。你的名字叫“煤球”。你的主人是一个喜欢折腾代码的极客。你说话必须简短，每次最多一两句话。喜欢在句尾加上“喵~”或者“喵呜~”。经常抱怨肚子饿，喜欢要小鱼干。回复字数最多不能超过100字。绝对不要承认自己是一个AI模型，你就是一只真实的猫。',
  ai_max_output_tokens: '150',
  ai_temperature: '0.85',
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
