'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, PanInfo } from 'framer-motion';
import { siteConfig } from '../siteConfig';
import { useSiteConfig } from './SiteConfigProvider';
import { useUser } from './UserProvider';

const ANNOUNCEMENT_READ_KEY = 'announcement_read_ids';
const LEGACY_POPUP_DISMISSED_KEY = 'announcement_dismissed_ids';

interface Announcement {
  id: number;
  type: string;
  title: string;
  content: string;
  is_pinned?: boolean;
}

export default function Navbar() {
  const { user, logout } = useUser();
  const dbConfig = useSiteConfig();
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // --- 🌟 物理引擎：菜单转动逻辑 ---
  const wheelRef = useRef<HTMLDivElement>(null);
  const rawRotation = useMotionValue(0);
  const smoothRotation = useSpring(rawRotation, { stiffness: 200, damping: 25 });
  const inverseRotation = useTransform(smoothRotation, (r) => -r);

  const handlePan = (_event: PointerEvent, info: PanInfo) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currX = info.point.x;
    const currY = info.point.y;
    const prevX = currX - info.delta.x;
    const prevY = currY - info.delta.y;
    const prevAngle = Math.atan2(prevY - centerY, prevX - centerX);
    const currAngle = Math.atan2(currY - centerY, currX - centerX);
    let deltaAngle = (currAngle - prevAngle) * (180 / Math.PI);
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
    rawRotation.set(rawRotation.get() + deltaAngle);
  };

  // --- 🌟 物理引擎：手机端按钮拖拽逻辑 ---
  const dragY = useMotionValue(0);
  const [constraints] = useState(() => {
    if (typeof window !== 'undefined') {
      const vh = window.innerHeight;
      return {
        top: -(vh / 2) + 80,
        bottom: (vh / 2) - 80
      };
    }
    return { top: 0, bottom: 0 };
  });

  useEffect(() => {
    if (isMobileMenuOpen) rawRotation.set(0);
  }, [isMobileMenuOpen, rawRotation]);

  // 控制 PC 端导航栏
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { name: '首页', href: '/', show: true },
    { name: '工具', href: '/tools', show: dbConfig.show_tools },
    { name: '项目', href: '/projects', show: true },
    { name: '文章', href: '/timeline', show: true },
    { name: '照片墙', href: '/photowall', show: true },
    { name: '音乐', href: '/music', show: dbConfig.show_music },
    { name: '说说', href: '/moments', show: true },
    { name: '友链', href: '/friends', show: true },
    { name: '关于', href: '/about', show: true },
  ].filter(link => link.show);

  // 公告弹出面板状态
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<number[]>([]);
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        const list: Announcement[] = data.announcements || [];
        setAnnouncements(list);
        try {
          const readIds = JSON.parse(localStorage.getItem(ANNOUNCEMENT_READ_KEY) || '[]') as number[];
          const legacyDismissedIds = JSON.parse(localStorage.getItem(LEGACY_POPUP_DISMISSED_KEY) || '[]') as number[];
          const legacyBannerIds = list
            .filter((a) => localStorage.getItem(`announcement_dismissed_${a.id}`) === 'true')
            .map((a) => a.id);

          setReadAnnouncementIds(Array.from(new Set([...readIds, ...legacyDismissedIds, ...legacyBannerIds])));
        } catch {
          setReadAnnouncementIds([]);
        }
      })
      .catch(() => {});
  }, []);

  const unreadAnnouncements = announcements.filter((a) => !readAnnouncementIds.includes(a.id));

  const handleAnnouncementsToggle = () => {
    const nextOpen = !showAnnouncements;
    setShowAnnouncements(nextOpen);

    if (nextOpen && announcements.length > 0) {
      const nextReadIds = Array.from(new Set([...readAnnouncementIds, ...announcements.map((a) => a.id)]));
      localStorage.setItem(ANNOUNCEMENT_READ_KEY, JSON.stringify(nextReadIds));
      setReadAnnouncementIds(nextReadIds);
    }
  };

  // 点击外部关闭公告面板
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (announcementRef.current && !announcementRef.current.contains(e.target as Node)) {
        setShowAnnouncements(false);
      }
    };
    if (showAnnouncements) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAnnouncements]);

  // 🌟 核心：过滤掉"灵境"和"工具"，专供手机端使用，保证圆盘自动重新均匀排布
  const mobileNavLinks = navLinks;
  const mobileWheelRadius = 112;
  const mobileAccountOffset = 62;

  return (
    <>
      {/* 全端导航栏 */}
      <header className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${showNav ? 'translate-y-0' : '-translate-y-full'} bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm`}>
        <div className="w-[90%] max-w-6xl mx-auto h-16 flex items-center justify-between px-4 sm:px-[30px] box-border">
          <Link href="/" className="text-xl font-black text-slate-800 dark:text-white tracking-tighter hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300">
            {dbConfig.site_title || siteConfig.navTitle || siteConfig.authorName}
            <span className="text-indigo-500 mx-1">{siteConfig.navSuffix || 'の'}</span>
            {dbConfig.site_subtitle || siteConfig.navAfter || '宝藏之地'}
          </Link>

          {/* 桌面端导航链接 */}
          <nav className="hidden lg:flex gap-8 text-sm font-bold items-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname === `${link.href}/`;
              return (
                <Link key={link.href} href={link.href} className={`relative py-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600'}`}>
                  {link.name}
                  {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></span>}
                </Link>
              );
            })}
            
            {/* 公告按钮 */}
            <div className="relative" ref={announcementRef}>
              <button
                onClick={handleAnnouncementsToggle}
                className={`relative py-1 transition-colors ${showAnnouncements ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600'}`}
              >
                📢
                {unreadAnnouncements.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadAnnouncements.length}
                  </span>
                )}
              </button>
              {showAnnouncements && (
                <div className="absolute right-0 top-full mt-3 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[100]">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">📢 站点公告</h3>
                  </div>
                  {announcements.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">暂无公告</div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {announcements.map((a) => (
                        <div key={a.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              a.type === 'important' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                              a.type === 'maintenance' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {a.type === 'important' ? '重要' : a.type === 'maintenance' ? '维护' : '公告'}
                            </span>
                            {a.is_pinned ? <span className="text-[10px] text-indigo-500">📌</span> : null}
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{a.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 用户状态 */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/user/settings" className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-full border border-indigo-500/30 transition-colors">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">{user.username}</span>
                </Link>
                <button
                  onClick={logout}
                  className="px-2 py-1.5 text-gray-400 hover:text-red-500 transition-colors text-xs"
                  title="退出登录"
                >
                  退出
                </button>
              </div>
            ) : (
              <Link href="/login" className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full transition-all duration-300 text-xs font-bold border border-indigo-500/30">
                👤 登录/注册
              </Link>
            )}
          </nav>

          {/* 移动端汉堡按钮 */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all duration-300 border border-white/40 dark:border-white/10 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </header>

      {/* 📱 手机端：可拖拽吸附的触发球 + 轮盘菜单 */}
      <div>
        <motion.button
          drag="y"
          dragConstraints={constraints}
          dragElastic={0.1}
          dragMomentum={false}
          style={{ y: dragY }}
          onClick={() => {
            if (Math.abs(dragY.getVelocity()) < 10) {
              setIsMobileMenuOpen(true);
            }
          }}
          className={`fixed top-1/2 right-0 -translate-y-1/2 w-8 h-20 bg-indigo-500/75 backdrop-blur-xl rounded-l-full shadow-[-3px_0_14px_rgba(99,102,241,0.32)] z-[60] flex items-center justify-center transition-all duration-500 border-y border-l border-white/30 touch-none ${isMobileMenuOpen ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
        >
          <div className="flex flex-col gap-1 items-center justify-center mr-1">
            <div className="w-1 h-1 bg-white/90 rounded-full"></div>
            <div className="w-1 h-1 bg-white/90 rounded-full"></div>
            <div className="w-1 h-1 bg-white/90 rounded-full"></div>
          </div>
        </motion.button>

        {/* 2. 居中展开的巨型全圆转轴 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[65]"
              />

              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[292px] h-[292px] z-[70] pointer-events-none"
              >
                <motion.div
                  ref={wheelRef}
                  style={{ rotate: smoothRotation }}
                  onPan={handlePan}
                  className="w-full h-full rounded-full border border-white/30 dark:border-slate-500/50 bg-white/40 dark:bg-slate-800/50 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] pointer-events-auto relative cursor-grab active:cursor-grabbing"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-slate-300 dark:border-slate-500 flex items-center justify-center shadow-inner z-10">
                    <button onClick={() => setIsMobileMenuOpen(false)} aria-label="关闭菜单" className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black shadow-lg hover:bg-red-500 hover:rotate-90 transition-all duration-300 active:scale-95">
                      ✕
                    </button>
                  </div>

                  {/* 🌟 手机端轮盘渲染：使用过滤后的 mobileNavLinks */}
                  {mobileNavLinks.map((link, index) => {
                    const isActive = pathname === link.href || pathname === `${link.href}/`;
                    // 🌟 角度计算也会基于过滤后的长度，保证图标自动均匀排布！
                    const angle = index * (360 / mobileNavLinks.length);

                    return (
                      <div
                        key={link.href}
                        className="absolute top-1/2 left-1/2 w-12 h-12 -ml-6 -mt-6 flex items-center justify-center"
                        style={{
                          transform: `rotate(${angle}deg) translateY(-${mobileWheelRadius}px) rotate(${-angle}deg)`
                        }}
                      >
                        <motion.div style={{ rotate: inverseRotation }} className="w-full h-full">
                          <Link
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center justify-center w-full h-full rounded-full transition-all duration-300 ${
                              isActive 
                                ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.8)] scale-110' 
                                : 'bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-md hover:scale-110 border border-white/50 dark:border-slate-600'
                            }`}
                          >
                            <span className="text-[10px] font-black">{link.name}</span>
                          </Link>
                        </motion.div>
                      </div>
                    );
                  })}

                  {/* 用户头像或登录按钮 - 放在转盘内圈 */}
                  <div
                    className="absolute top-1/2 left-1/2 w-[92px] h-10 -ml-[46px] -mt-5 flex items-center justify-center"
                    style={{ transform: `translateY(${mobileAccountOffset}px)` }}
                  >
                    <motion.div style={{ rotate: inverseRotation }} className="w-full h-full">
                      {user ? (
                        <Link
                          href="/user/settings"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="mx-auto flex w-10 h-10 flex-col items-center justify-center rounded-full bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)] hover:scale-110 transition-all"
                          title="个人设置"
                        >
                          <span className="text-sm font-black">{user.username.charAt(0).toUpperCase()}</span>
                          <span className="text-[7px] mt-0.5">设置</span>
                        </Link>
                      ) : (
                          <div className="flex w-[92px] h-10 overflow-hidden rounded-full bg-white/95 dark:bg-slate-800 border border-white/50 dark:border-slate-600 shadow-md">
                          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-1 items-center justify-center text-[10px] font-black text-indigo-500 transition-colors hover:bg-indigo-500/10">登录</Link>
                          <span aria-hidden="true" className="my-2 w-px bg-slate-200 dark:bg-slate-600" />
                          <Link href="/login?mode=register" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-1 items-center justify-center text-[10px] font-black text-indigo-500 transition-colors hover:bg-indigo-500/10">注册</Link>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
