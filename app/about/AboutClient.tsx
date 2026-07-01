"use client";

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import ReactMarkdown from 'react-markdown';

interface ProfileData {
  name: string;
  bio: string;
  avatar: string;
  social: Record<string, string | undefined>;
  danmakuCount?: number;
}

export default function AboutClient({ profile }: { profile: ProfileData }) {
  const buildDate = new Date(siteConfig.buildDate || '2026-03-23');
  const [daysSinceBuild] = useState(() =>
    Math.floor((Date.now() - buildDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // 立即展示内容，不等待任何异步操作
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="w-full max-w-4xl mx-auto mt-24 md:mt-28 px-4 sm:px-10 relative z-10">
          {/* 头部个人信息卡 */}
          <div className="bg-white/40 dark:bg-slate-800/50 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden transition-colors duration-700">
            {/* 封面区域 */}
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 30% 50%, white 0%, transparent 50%), radial-gradient(circle at 70% 80%, white 0%, transparent 40%)` }}></div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/40 dark:from-slate-800/80 to-transparent"></div>
            </div>

            {/* 头像与信息 */}
            <div className="relative px-6 md:px-12 pb-8 md:pb-12 -mt-16">
              <div className="relative w-32 h-32 mb-6">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-[2px] opacity-60"></div>
                <div className="relative w-full h-full rounded-full p-1.5 bg-white dark:bg-slate-800 shadow-xl">
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight transition-colors duration-700">{profile.name}</h1>
              <div className="text-base md:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl transition-colors duration-700 prose prose-slate dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown>{profile.bio}</ReactMarkdown>
              </div>

              {/* 统计数据 */}
              <div className="flex flex-wrap gap-4 md:gap-6 mt-8">
                <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/40 dark:border-white/10 shadow-sm">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{daysSinceBuild}</div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">天</div>
                </div>
                <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/40 dark:border-white/10 shadow-sm">
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{siteConfig.cloudMusicIds?.length || 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">音轨</div>
                </div>
                <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/40 dark:border-white/10 shadow-sm">
                  <div className="text-2xl font-black text-pink-600 dark:text-pink-400">{profile.danmakuCount ?? siteConfig.danmakuList?.length ?? 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">弹幕</div>
                </div>
              </div>

              {/* 社交链接 */}
              <div className="flex flex-wrap gap-3 mt-8">
                {profile.social?.github && (
                  <a href={profile.social.github} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-full border border-white/40 dark:border-white/10 shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all">
                    GitHub
                  </a>
                )}
                {profile.social?.gitee && (
                  <a href={profile.social.gitee} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-full border border-white/40 dark:border-white/10 shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all">
                    Gitee
                  </a>
                )}
                {profile.social?.bilibili && (
                  <a href={profile.social.bilibili} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-full border border-white/40 dark:border-white/10 shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-pink-500 hover:text-white transition-all">
                    B站
                  </a>
                )}
                {profile.social?.qq && (
                  <span className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-full border border-white/40 dark:border-white/10 shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300">
                    QQ: {profile.social.qq}
                  </span>
                )}
                {profile.social?.wechat && (
                  <span className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-full border border-white/40 dark:border-white/10 shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300">
                    微信: {profile.social.wechat}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 技术栈 */}
          <div className="mt-8 bg-white/40 dark:bg-slate-800/50 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/40 dark:border-white/10 p-6 md:p-12 transition-colors duration-700">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">技术栈</h2>
            <div className="flex flex-wrap gap-3">
              {siteConfig.footerBadges?.map((badge, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2.5 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-xl border border-white/40 dark:border-white/10 shadow-sm">
                  <svg className={`w-4 h-4 ${badge.color}`} fill="currentColor" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: badge.svg }} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{badge.name}</span>
                </div>
              ))}
              {siteConfig.icpConfig && (
                <a href={siteConfig.icpConfig.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-xl border border-white/40 dark:border-white/10 shadow-sm hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                  <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{siteConfig.icpConfig.name}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
