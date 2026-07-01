"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const LOGIN_PATH = '/login';

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const loginRedirectStartedRef = useRef(false);
  const revealTimerRef = useRef<number | null>(null);

  const revealApp = useCallback(() => {
    document.documentElement.classList.remove('curtain-pending');
    document.documentElement.classList.add('curtain-ready');
  }, []);

  const waitForLoginRouteThenReveal = useCallback(() => {
    const startedAt = window.performance.now();

    const revealWhenReady = () => {
      const routeReady = !loginRedirectStartedRef.current || window.location.pathname === LOGIN_PATH;
      const timedOut = window.performance.now() - startedAt > 1600;

      if (routeReady || timedOut) {
        loginRedirectStartedRef.current = false;
        revealApp();
        setShow(false);
        return;
      }

      revealTimerRef.current = window.setTimeout(revealWhenReady, 50);
    };

    revealWhenReady();
  }, [revealApp]);

  const startLoginRedirect = useCallback(() => {
    try {
      if (window.location.pathname !== '/' || sessionStorage.getItem('animated-login-entered')) {
        return false;
      }

      sessionStorage.setItem('animated-login-entered', '1');
      loginRedirectStartedRef.current = true;
      router.replace(LOGIN_PATH);
      return true;
    } catch {
      return false;
    }
  }, [router]);

  useEffect(() => {
    if (loginRedirectStartedRef.current && pathname === LOGIN_PATH) {
      waitForLoginRouteThenReveal();
    }
  }, [pathname, waitForLoginRouteThenReveal]);

  useEffect(() => {
    const handleCurtainOpening = (event: MessageEvent) => {
      if (event.data?.type !== 'curtain-opening') return;
      startLoginRedirect();
    };

    const finishLoading = () => {
      if (loginRedirectStartedRef.current || startLoginRedirect()) {
        waitForLoginRouteThenReveal();
        return;
      }

      revealApp();
      setShow(false);
    };

    window.addEventListener('message', handleCurtainOpening);

    let interval: number | undefined;
    let fallback: number | undefined;

    const cleanup = () => {
      window.removeEventListener('message', handleCurtainOpening);
      if (interval) window.clearInterval(interval);
      if (fallback) window.clearTimeout(fallback);
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
    };

    try {
      if (sessionStorage.getItem('curtain-played')) {
        finishLoading();
        return cleanup;
      }
    } catch {
      revealApp();
      return cleanup;
    }

    setShow(true);

    interval = window.setInterval(() => {
      try {
        if (sessionStorage.getItem('curtain-played')) {
          finishLoading();
          if (interval) window.clearInterval(interval);
        }
      } catch {
        revealApp();
        setShow(false);
        if (interval) window.clearInterval(interval);
      }
    }, 100);

    fallback = window.setTimeout(() => {
      finishLoading();
      if (interval) window.clearInterval(interval);
    }, 4500);

    return cleanup;
  }, [revealApp, startLoginRedirect, waitForLoginRouteThenReveal]);

  if (!show) return null;

  return (
    <iframe
      src="/curtain-reveal/index.html"
      title="Loading page"
      aria-label="Loading page"
      className="fixed inset-0 z-[100000] h-dvh w-screen border-0 bg-transparent"
    />
  );
}
