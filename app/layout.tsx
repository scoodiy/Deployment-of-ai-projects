import 'katex/dist/katex.min.css';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import BackgroundEffects from "../components/BackgroundEffects";
import { MusicProvider } from "../components/MusicProvider";
import FloatingPlayer from "../components/FloatingPlayer";
import { siteConfig as staticConfig } from "../siteConfig";
import { getSiteConfig } from "../lib/site-config";
import { SiteConfigProvider } from "../components/SiteConfigProvider";
import ClickEffect from "../components/ClickEffect";
import BackgroundSlider from "../components/BackgroundSlider";
import GlobalToolbox from "../components/GlobalToolbox";
import SplashScreen from "../components/SplashScreen";
import CyberCat from '../components/CyberCat';
import DanmakuBackground from '../components/DanmakuBackground';
import GlobalSnow from '../components/GlobalSnow';
import { UserProvider } from '../components/UserProvider';
import { ToastProvider } from '../components/ToastProvider';
import MobileBackButton from '../components/MobileBackButton';

import Script from 'next/script';

// 获取数据库配置，失败时回退到静态配置
const dbConfig = getSiteConfig();
const siteConfig = {
  ...staticConfig,
  title: dbConfig.site_title || staticConfig.title,
  bio: dbConfig.about_content || staticConfig.bio,
  navTitle: dbConfig.site_title || staticConfig.navTitle,
};

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const config = getSiteConfig();
  return {
    title: config.site_title || staticConfig.title,
    description: config.about_content || staticConfig.bio,
    icons: { icon: staticConfig.faviconUrl, apple: staticConfig.faviconUrl },
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

const notoSerif = localFont({
  src: [
    { path: "../public/fonts/NotoSerifSC-Regular.ttf", weight: "400" },
    { path: "../public/fonts/NotoSerifSC-Bold.ttf", weight: "700" },
    { path: "../public/fonts/NotoSerifSC-Black.ttf", weight: "900" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              #app-mount-root { opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.5s ease, visibility 0.5s ease; }
              html.splash-seen #app-mount-root { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
              /* 确保背景图加载前有稳定底色 */
              body { background-color: #f8fafc; }
              .dark body { background-color: #020617; }
            `
          }}
        />

        <Script id="handle-splash-logic" strategy="beforeInteractive">
          {`
            try {
              if (sessionStorage.getItem('hasSeenSplash') === 'true') {
                document.documentElement.classList.add('splash-seen');
              }
            } catch (e) {}
          `}
        </Script>
      </head>

      <body className="w-screen overflow-x-hidden min-h-full flex flex-col relative transition-colors duration-1000 bg-slate-50 dark:bg-slate-950 font-serif">
        <ThemeProvider>
          <SiteConfigProvider>
            <UserProvider>
              <ToastProvider>
                <SplashScreen />
                <MusicProvider>
                  <div id="app-mount-root" className="flex-1 flex flex-col transition-opacity duration-1000">
                    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                      {!siteConfig.useGradient && <BackgroundSlider />}
                      <div className="absolute inset-0 z-[-9] bg-white/30 dark:bg-slate-900/40 backdrop-blur-md transition-colors duration-1000"></div>
                    <div
                      className="absolute inset-0 z-[-8] opacity-60 dark:opacity-20 mix-blend-color transition-opacity duration-1000 transform-gpu"
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
                    {children}
                  </div>

                  <FloatingPlayer />
                  <GlobalToolbox />
                  <ClickEffect />
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
              </MusicProvider>
            </ToastProvider>

            <CyberCat />
            </UserProvider>
          </SiteConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
