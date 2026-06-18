'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SiteConfig {
  site_title: string;
  site_subtitle: string;
  hero_title: string;
  hero_subtitle: string;
  show_ai_assistant: boolean;
  show_tools: boolean;
  show_games: boolean;
  show_blog: boolean;
  show_about: boolean;
  show_music: boolean;
  about_title: string;
  about_content: string;
  avatar_url: string;
  github_url: string;
  email: string;
  bilibili_url: string;
  bio: string;
  qq: string;
  wechat: string;
}

const defaultConfig: SiteConfig = {
  site_title: '云悠悠',
  site_subtitle: '的宝藏之地',
  hero_title: '欢迎来到云悠悠的宝藏之地',
  hero_subtitle: '代码、学术与生活的碎片记录',
  show_ai_assistant: true,
  show_tools: true,
  show_games: true,
  show_blog: true,
  show_about: true,
  show_music: true,
  about_title: '关于我',
  about_content: '',
  avatar_url: '',
  github_url: '',
  email: '',
  bilibili_url: '',
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
            show_ai_assistant: configMap.show_ai_assistant !== 'false',
            show_tools: configMap.show_tools !== 'false',
            show_games: configMap.show_games !== 'false',
            show_blog: configMap.show_blog !== 'false',
            show_about: configMap.show_about !== 'false',
            show_music: configMap.show_music !== 'false',
            about_title: configMap.about_title || defaultConfig.about_title,
            about_content: configMap.about_content || defaultConfig.about_content,
            avatar_url: configMap.avatar_url || defaultConfig.avatar_url,
            github_url: configMap.github_url || defaultConfig.github_url,
            email: configMap.email || defaultConfig.email,
            bilibili_url: configMap.bilibili_url || defaultConfig.bilibili_url,
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
