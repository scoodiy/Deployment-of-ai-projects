"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DIRECT_ENTRY_MESSAGE = 'animated-login-enter';

function markDirectEntry() {
  try {
    sessionStorage.setItem('animated-login-entered', '1');
    sessionStorage.setItem('curtain-played', '1');
  } catch {
    // Session storage can be unavailable in hardened browser modes.
  }
}

export default function LoginPageClient() {
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== DIRECT_ENTRY_MESSAGE) return;

      markDirectEntry();
      router.replace('/home');
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  return (
    <main className="min-h-dvh w-screen overflow-hidden bg-white">
      <iframe
        src="/animated-login/index.html"
        title="Animated characters login page"
        aria-label="Animated characters login page"
        className="block h-dvh w-screen border-0"
      />
    </main>
  );
}
