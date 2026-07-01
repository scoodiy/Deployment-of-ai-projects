'use client';

import { useEffect, useRef, useState } from 'react';

interface CurtainRevealProps {
  oncePerSession?: boolean;
}

export default function CurtainReveal({ oncePerSession = true }: CurtainRevealProps) {
  const [visible, setVisible] = useState(true);
  const [lineState, setLineState] = useState<'idle' | 'expand' | 'pulse' | 'rotate'>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const skipped = useRef(false);
  const curtainRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const addTimer = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timers.current.push(id);
    return id;
  };

  const cleanup = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const skip = () => {
    if (skipped.current || !visible) return;
    skipped.current = true;
    cleanup();

    const curtain = curtainRef.current;
    const line = lineRef.current;
    if (curtain) {
      curtain.style.transition = 'transform 0.4s cubic-bezier(0.76, 0, 0.24, 1)';
      const left = curtain.querySelector<HTMLElement>('.curtain-left');
      const right = curtain.querySelector<HTMLElement>('.curtain-right');
      if (left) left.style.transform = 'translateX(-100%)';
      if (right) right.style.transform = 'translateX(100%)';
    }
    if (line) {
      (line as HTMLElement).style.display = 'none';
    }

    addTimer(() => setVisible(false), 500);

    if (oncePerSession && typeof window !== 'undefined') {
      try { sessionStorage.setItem('login-curtain-played', '1'); } catch { /* */ }
    }
  };

  useEffect(() => {
    // Reduced motion: skip entirely
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisible(false);
      return;
    }

    // Session check
    if (oncePerSession) {
      try {
        if (sessionStorage.getItem('login-curtain-played') === '1') {
          setVisible(false);
          return;
        }
      } catch { /* */ }
    }

    const runAnimation = () => {
      // Step 1: Dot appears
      addTimer(() => {
        dotRef.current?.classList.add('animate');
      }, 200);

      // Step 2: Dot animationend -> line expands
      const dotEl = dotRef.current;
      if (dotEl) {
        const onDotEnd = () => {
          dotEl.removeEventListener('animationend', onDotEnd);
          if (skipped.current) return;
          setLineState('expand');
        };
        dotEl.addEventListener('animationend', onDotEnd);
      }

      // Step 3: Line expand done -> pulse
      addTimer(() => {
        if (skipped.current) return;
        const line = lineRef.current;
        if (!line) return;
        const onExpandEnd = () => {
          line.removeEventListener('animationend', onExpandEnd);
          if (skipped.current) return;
          setLineState('pulse');
        };
        line.addEventListener('animationend', onExpandEnd);
        line.classList.add('expand');
      }, 750);

      // Step 4: Pulse done -> rotate
      addTimer(() => {
        if (skipped.current) return;
        const line = lineRef.current;
        if (!line) return;
        const onPulseEnd = () => {
          line.removeEventListener('animationend', onPulseEnd);
          if (skipped.current) return;
          setLineState('rotate');
        };
        line.addEventListener('animationend', onPulseEnd);
        line.classList.remove('expand');
        line.classList.add('pulse');
      }, 1100);

      // Step 5: Rotate done -> open curtains
      addTimer(() => {
        if (skipped.current) return;
        const line = lineRef.current;
        if (!line) return;
        const onRotateEnd = () => {
          line.removeEventListener('animationend', onRotateEnd);
          if (skipped.current) return;
          curtainRef.current?.classList.add('open');
        };
        line.addEventListener('animationend', onRotateEnd);
        line.classList.remove('pulse');
        line.classList.add('rotate');
      }, 1550);

      // Step 6: Curtain animation done -> hide
      addTimer(() => {
        if (skipped.current) return;
        const curtain = curtainRef.current;
        if (curtain) {
          const left = curtain.querySelector<HTMLElement>('.curtain-left');
          const right = curtain.querySelector<HTMLElement>('.curtain-right');
          const onLeftEnd = () => {
            if (skipped.current) return;
            setVisible(false);
            if (oncePerSession) {
              try { sessionStorage.setItem('login-curtain-played', '1'); } catch { /* */ }
            }
          };
          left?.addEventListener('animationend', onLeftEnd, { once: true });
        }
      }, 2000);
    };

    addTimer(runAnimation, 50);

    return cleanup;
  }, [oncePerSession]);

  if (!visible) return null;

  return (
    <>
      <style jsx global>{`
        .login-curtain-overlay {
          position: fixed;
          inset: 0;
          z-index: 9000;
          cursor: pointer;
        }
        .login-curtain-left,
        .login-curtain-right {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          background: #1a1a1a;
          will-change: transform;
        }
        .login-curtain-left { left: 0; }
        .login-curtain-right { right: 0; }
        .login-curtain-left::before,
        .login-curtain-right::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }
        .login-curtain-overlay.open .login-curtain-left {
          animation: login-curtain-open-left 0.8s cubic-bezier(0.76, 0, 0.24, 1) forwards;
        }
        .login-curtain-overlay.open .login-curtain-right {
          animation: login-curtain-open-right 0.8s cubic-bezier(0.76, 0, 0.24, 1) forwards;
        }
        @keyframes login-curtain-open-left {
          to { transform: translateX(-100%); }
        }
        @keyframes login-curtain-open-right {
          to { transform: translateX(100%); }
        }
        .login-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f5f5f0;
          opacity: 0;
          will-change: transform, opacity;
          transform: scale(0);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
        }
        .login-dot.animate {
          animation: login-dot-seq 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes login-dot-seq {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          40% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
        .login-line {
          position: absolute;
          width: 100vw;
          height: 2px;
          background: #f5f5f0;
          opacity: 0;
          top: 50%;
          left: 0;
          transform: translateY(-50%) scaleX(0);
          transform-origin: center center;
          will-change: transform, opacity;
        }
        .login-line.expand {
          animation: login-line-expand 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes login-line-expand {
          0% { opacity: 1; transform: translateY(-50%) scaleX(0); }
          100% { opacity: 1; transform: translateY(-50%) scaleX(1); }
        }
        .login-line.pulse {
          opacity: 1;
          transform: translateY(-50%) scaleX(1);
          animation: login-line-pulse 0.35s ease-in-out forwards;
        }
        @keyframes login-line-pulse {
          0% { transform: translateY(-50%) scaleX(1) scaleY(1); box-shadow: none; }
          50% { transform: translateY(-50%) scaleX(1) scaleY(2.5); box-shadow: 0 0 12px rgba(245, 245, 240, 0.3); }
          100% { transform: translateY(-50%) scaleX(1) scaleY(1); box-shadow: none; }
        }
        .login-line.rotate {
          opacity: 1;
          transform: translateY(-50%) scaleX(1);
          animation: login-line-rotate 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes login-line-rotate {
          0% { transform: translateY(-50%) scaleX(1) rotate(0deg); opacity: 1; }
          75% { transform: translateY(-50%) scaleX(1) rotate(90deg); opacity: 1; }
          100% { transform: translateY(-50%) scaleX(1) rotate(90deg); opacity: 0; }
        }
        .login-skip-hint {
          position: fixed;
          bottom: 30px;
          bottom: calc(30px + env(safe-area-inset-bottom));
          left: 50%;
          z-index: 9001;
          color: rgba(245, 245, 240, 0.4);
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          pointer-events: none;
          transform: translateX(-50%);
          animation: login-hint-fade 0.6s 1.2s ease forwards;
          white-space: nowrap;
          font-family: 'Outfit', sans-serif;
        }
        @keyframes login-hint-fade {
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-curtain-overlay,
          .login-line-container,
          .login-skip-hint { display: none !important; }
        }
      `}</style>

      <div
        className="login-curtain-overlay"
        ref={curtainRef}
        onClick={skip}
        onTouchStart={skip}
        role="button"
        tabIndex={-1}
        aria-label="跳过动画"
      >
        <div className="login-curtain-left" />
        <div className="login-curtain-right" />
      </div>

      <div className="login-line-container" style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div ref={dotRef} className="login-dot" />
        <div
          ref={lineRef}
          className={`login-line ${lineState !== 'idle' ? lineState : ''}`}
        />
      </div>

      <div className="login-skip-hint">点击任意位置跳过</div>
    </>
  );
}
