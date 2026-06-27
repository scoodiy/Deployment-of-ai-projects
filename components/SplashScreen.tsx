"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../siteConfig';

type SplashPhase = 'assembling' | 'ready' | 'exiting';

const fragments = [
  { id: 'north-west', className: 'left-4 top-6 h-20 w-28 md:left-16 md:top-14 md:h-28 md:w-40', initial: { x: -120, y: -80, rotate: -18 }, exit: { x: -160, y: -120, rotate: -24 } },
  { id: 'north-east', className: 'right-5 top-10 h-16 w-24 md:right-20 md:top-20 md:h-24 md:w-36', initial: { x: 120, y: -90, rotate: 16 }, exit: { x: 150, y: -130, rotate: 26 } },
  { id: 'west', className: 'left-8 top-1/2 h-24 w-16 md:left-28 md:h-36 md:w-24', initial: { x: -150, y: 20, rotate: 12 }, exit: { x: -180, y: 40, rotate: -18 } },
  { id: 'east', className: 'right-8 top-1/2 h-24 w-16 md:right-28 md:h-36 md:w-24', initial: { x: 150, y: -20, rotate: -12 }, exit: { x: 180, y: -40, rotate: 18 } },
  { id: 'south-west', className: 'bottom-12 left-10 h-16 w-28 md:bottom-20 md:left-24 md:h-24 md:w-44', initial: { x: -100, y: 100, rotate: 20 }, exit: { x: -130, y: 130, rotate: 32 } },
  { id: 'south-east', className: 'bottom-10 right-10 h-20 w-24 md:bottom-24 md:right-28 md:h-28 md:w-40', initial: { x: 110, y: 110, rotate: -20 }, exit: { x: 140, y: 140, rotate: -34 } },
];

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>('assembling');

  useEffect(() => {
    setIsMounted(true);
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash') === 'true';

    if (hasSeenSplash) {
      document.documentElement.classList.add('splash-seen');
      return;
    }

    setShow(true);
    const readyTimer = setTimeout(() => setPhase('ready'), 1300);
    return () => clearTimeout(readyTimer);
  }, []);

  const enterSite = () => {
    if (phase === 'exiting') return;
    setPhase('exiting');
    sessionStorage.setItem('hasSeenSplash', 'true');

    setTimeout(() => {
      document.documentElement.classList.add('splash-seen');
    }, 420);

    setTimeout(() => {
      setShow(false);
    }, 920);
  };

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash-screen-container"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100000] overflow-hidden bg-slate-950 text-white"
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_36%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,27,75,0.94))]"
            animate={{ opacity: phase === 'exiting' ? 0 : 1, scale: phase === 'exiting' ? 1.08 : 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />

          {fragments.map((fragment, index) => (
            <motion.div
              aria-hidden="true"
              key={fragment.id}
              className={`absolute rounded-[1.5rem] border border-white/15 bg-white/8 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl ${fragment.className}`}
              initial={{ opacity: 0, scale: 0.86, ...fragment.initial }}
              animate={phase === 'exiting'
                ? { opacity: 0, scale: 0.72, filter: 'blur(18px)', ...fragment.exit }
                : { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, filter: 'blur(0px)' }}
              transition={{ delay: phase === 'exiting' ? index * 0.025 : index * 0.1, duration: phase === 'exiting' ? 0.7 : 0.85, ease: 'easeOut' }}
            />
          ))}

          <div className="relative z-10 flex min-h-screen items-center justify-center px-5">
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={phase === 'exiting'
                ? { opacity: 0, y: -18, scale: 0.9, filter: 'blur(16px)' }
                : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ delay: phase === 'assembling' ? 0.55 : 0, duration: phase === 'exiting' ? 0.55 : 0.75, ease: 'easeOut' }}
              className="relative w-full max-w-[26rem] overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/12 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-2xl md:p-8"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" />
              <div className="relative">
                <div className="mx-auto mb-5 h-20 w-20 rounded-3xl border border-white/20 bg-white/10 p-1.5 shadow-xl shadow-indigo-950/40 md:h-24 md:w-24">
                  <img src={siteConfig.avatarUrl} alt="" className="h-full w-full rounded-[1.25rem] object-cover" />
                </div>

                <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.36em] text-indigo-200/80">
                  ENTRY GATE ONLINE
                </p>
                <h1 className="text-2xl font-black leading-tight text-white md:text-3xl">
                  {siteConfig.authorName}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-200/80">
                  正在拼装通往宝藏之地的入口
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={enterSite}
                    disabled={phase === 'exiting'}
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-indigo-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-wait disabled:opacity-70"
                  >
                    进入宝藏之地
                  </button>
                  <a
                    href="/login"
                    className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    登录 / 注册
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
