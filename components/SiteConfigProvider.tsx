'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SiteConfig {
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
  email: string;
  bilibili_url: string;
  custom_links: string;
  danmaku_list: string;
  bio: string;
  qq: string;
  wechat: string;
}

const defaultConfig: SiteConfig = {
  site_title: '云悠悠',
  site_subtitle: '的宝藏之地',
  hero_title: '欢迎来到云悠悠的宝藏之地',
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
  email: '',
  bilibili_url: '',
  custom_links: '[]',
  danmaku_list: '["在干嘛呢？","有笨蛋嘛？","前方高能反应！","GROMACS 跑起来了吗？","BUG 修复进度 99%","今天背单词了吗？","Tailwind CSS 拯救前端","写算法中","睡大觉中"]',
  bio: '在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。',
  qq: '1124533793',
  wechat: 'y悠悠',
};

const SiteConfigContext = createContext<SiteConfig>(defaultConfig);

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);

  useEffect(() => {
    fetch('/api/site-config/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.configs) {
          const configMap: Record<string, string> = {};
          data.configs.forEach((c: { config_key: string; config_value: string }) => {
            configMap[c.config_key] = c.config_value;
          });
          setConfig({
            site_title: configMap.site_title || defaultConfig.site_title,
            site_subtitle: configMap.site_subtitle || defaultConfig.site_subtitle,
            hero_title: configMap.hero_title || defaultConfig.hero_title,
            hero_subtitle: configMap.hero_subtitle || defaultConfig.hero_subtitle,
            hero_background_image: configMap.hero_background_image || defaultConfig.hero_background_image,
            announcement: configMap.announcement || defaultConfig.announcement,
            show_ai_assistant: configMap.show_ai_assistant !== 'false',
            show_tools: configMap.show_tools !== 'false',
            show_games: configMap.show_games !== 'false',
            show_blog: configMap.show_blog !== 'false',
            show_about: configMap.show_about !== 'false',
            show_music: configMap.show_music !== 'false',
            show_announcement: configMap.show_announcement === 'true',
            about_title: configMap.about_title || defaultConfig.about_title,
            about_content: configMap.about_content || defaultConfig.about_content,
            avatar_url: configMap.avatar_url || defaultConfig.avatar_url,
            github_url: configMap.github_url || defaultConfig.github_url,
            email: configMap.email || defaultConfig.email,
            bilibili_url: configMap.bilibili_url || defaultConfig.bilibili_url,
            custom_links: configMap.custom_links || defaultConfig.custom_links,
            danmaku_list: configMap.danmaku_list || defaultConfig.danmaku_list,
            bio: configMap.bio || defaultConfig.bio,
            qq: configMap.qq || defaultConfig.qq,
            wechat: configMap.wechat || defaultConfig.wechat,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}
