import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import BackgroundEffects from "../components/BackgroundEffects";
import RouteAwareMusicProvider from "../components/RouteAwareMusicProvider";
import { siteConfig as staticConfig } from "../siteConfig";
import { getSiteConfig } from "../lib/site-config";
import { SiteConfigProvider } from "../components/SiteConfigProvider";
import BackgroundSlider from "../components/BackgroundSlider";
import SplashScreen from "../components/SplashScreen";
import DanmakuBackground from '../components/DanmakuBackground';
import GlobalSnow from '../components/GlobalSnow';
import { UserProvider } from '../components/UserProvider';
import { ToastProvider } from '../components/ToastProvider';
import { PublicAnnouncementBanner, PublicOverlays } from '../components/PublicChrome';

// 获取数据库配置，失败时回退到静态配置
const dbConfig = getSiteConfig();
const siteConfig = {
  ...staticConfig,
  title: dbConfig.site_title || staticConfig.title,
  bio: dbConfig.about_content || staticConfig.bio,
  navTitle: dbConfig.site_title || staticConfig.navTitle,
};

// 使用 ISR 缓存，每60秒重新验证一次（而非每次请求都查数据库）
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const config = getSiteConfig();
  const title = config.site_title || staticConfig.title;
  const description = config.about_content || staticConfig.bio;
  return {
    metadataBase: new URL('https://ayuu.fun'),
    title,
    description,
    keywords: [title, '博客', '技术', '代码', '学术', '分子动力学', 'GROMACS', '神经网络', '个人博客'],
    icons: { icon: staticConfig.faviconUrl, apple: staticConfig.faviconUrl },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: title,
      title,
      description,
      locale: 'zh_CN',
      url: 'https://ayuu.fun',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: 'https://ayuu.fun',
    },
  };
}

const geistSans = localFont({
  src: [
    { path: "../public/fonts/Geist-Regular.ttf", weight: "400" },
    { path: "../public/fonts/Geist-Bold.ttf", weight: "700" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    { path: "../public/fonts/GeistMono-Regular.ttf", weight: "400" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased curtain-pending`} suppressHydrationWarning>
      <head>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #app-mount-root { opacity: 1; visibility: visible; pointer-events: auto; transition: opacity 0.5s ease, visibility 0.5s ease; }
              html.curtain-pending #app-mount-root { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
              html.curtain-ready #app-mount-root { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; transition: none !important; }
              body.camera-ocr-low-power .bg-effects-wrapper { opacity: 0 !important; visibility: hidden !important; }
              body.camera-ocr-low-power .site-gradient-layer { animation: none !important; opacity: 0.12 !important; }
              /* 确保背景图加载前有稳定底色 */
              body { background-color: #f8fafc; }
              .dark body { background-color: #020617; }
            `
          }}
        />
        <script
          id="handle-curtain-logic"
          dangerouslySetInnerHTML={{
            __html: `
            try {
              if (sessionStorage.getItem('curtain-played')) {
                document.documentElement.classList.remove('curtain-pending');
                document.documentElement.classList.add('curtain-ready');
              } else {
                document.documentElement.classList.add('curtain-pending');
              }
            } catch (e) {
              document.documentElement.classList.remove('curtain-pending');
              document.documentElement.classList.add('curtain-ready');
            }
          `
          }}
        />
      </head>

      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>
          <SiteConfigProvider>
            <UserProvider>
              <ToastProvider>
                <SplashScreen />
                <RouteAwareMusicProvider>
                  <div id="app-mount-root" className="flex-1 flex flex-col transition-opacity duration-1000">
                    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                      {!siteConfig.useGradient && <BackgroundSlider />}
                      <div className="absolute inset-0 z-[-9] bg-white/30 dark:bg-slate-900/40 backdrop-blur-md transition-colors duration-1000"></div>
                    <div
                      className="site-gradient-layer absolute inset-0 z-[-8] opacity-60 dark:opacity-20 mix-blend-color transition-opacity duration-1000 transform-gpu"
                      style={{
                        background: `linear-gradient(-45deg, ${siteConfig.themeColors.join(', ')})`,
                        backgroundSize: '400% 400%',
                        animation: 'gradientMove 15s ease infinite'
                      }}
                    ></div>
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/40 dark:bg-indigo-900/20 blur-[100px] rounded-full mix-blend-overlay z-[-7]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/30 dark:bg-purple-900/30 blur-[100px] rounded-full mix-blend-overlay z-[-7]"></div>

                    <div className="bg-effects-wrapper transition-opacity duration-1000">
                      <BackgroundEffects />
                    </div>
                  </div>

                  <DanmakuBackground />
                  <GlobalSnow />

                  <div className="relative z-10 flex-1 flex flex-col">
                    <PublicAnnouncementBanner />
                    {children}
                  </div>

                  <PublicOverlays />
                </div>

                <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
                  @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                  body.winter-mode .bg-effects-wrapper { opacity: 0 !important; visibility: hidden; }
                  .winter-mode .snow-cap { position: relative !important; overflow: visible !important; }
                  .dark.winter-mode .snow-cap {
                    background-color: rgba(23, 37, 84, 0.4) !important;
                    border-color: rgba(59, 130, 246, 0.3) !important;
                    backdrop-filter: blur(12px) brightness(80%) !important;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
                  }
                  body.winter-mode .snow-cap {
                    background-color: rgba(239, 246, 255, 0.45) !important;
                    border-color: rgba(191, 219, 254, 0.6) !important;
                    backdrop-filter: blur(12px) saturate(120%) !important;
                    box-shadow: 0 8px 32px rgba(191, 219, 254, 0.25) !important;
                    transition: all 0.7s ease !important;
                  }
                `}} />
              </RouteAwareMusicProvider>
            </ToastProvider>
            </UserProvider>
          </SiteConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
