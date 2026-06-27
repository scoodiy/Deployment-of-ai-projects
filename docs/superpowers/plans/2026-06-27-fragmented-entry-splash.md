# Fragmented Entry Splash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first-session entry splash where translucent fragments assemble into an entrance card, then disperse when the visitor clicks `进入宝藏之地`.

**Architecture:** Keep the feature inside the existing global `components/SplashScreen.tsx` layer. Preserve the current `sessionStorage.hasSeenSplash` and `html.splash-seen` contract from `app/layout.tsx`, so the app root remains hidden until the visitor enters and is skipped on later refreshes in the same session.

**Tech Stack:** Next.js App Router, React client component, Framer Motion, Tailwind CSS, Node test runner.

---

## File Structure

- Modify: `components/SplashScreen.tsx`
  - Owns the entry animation, phase state, session storage writes, enter action, and login link.
  - Uses existing `siteConfig` for avatar and title.
- Create: `tests/fragmented-entry-splash.test.ts`
  - Static regression tests for the key user-facing copy, phase names, session storage behavior, and `/login` link.
- No change: `app/login/page.tsx`
  - The real login system remains untouched.
- No change expected: `app/layout.tsx`
  - Existing `#app-mount-root` hiding and `html.splash-seen` reveal behavior should keep working.

## Task 1: Add Static Regression Test

**Files:**
- Create: `tests/fragmented-entry-splash.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/fragmented-entry-splash.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const splashPath = path.join(process.cwd(), 'components', 'SplashScreen.tsx');

function readSplash() {
  return readFileSync(splashPath, 'utf8');
}

test('fragmented entry splash exposes the intended entrance actions', () => {
  const source = readSplash();

  assert.match(source, /进入宝藏之地/);
  assert.match(source, /登录 \/ 注册/);
  assert.match(source, /href="\/login"/);
});

test('fragmented entry splash keeps the existing session reveal contract', () => {
  const source = readSplash();

  assert.match(source, /hasSeenSplash/);
  assert.match(source, /sessionStorage\.setItem\('hasSeenSplash', 'true'\)/);
  assert.match(source, /document\.documentElement\.classList\.add\('splash-seen'\)/);
});

test('fragmented entry splash uses explicit phases for assemble and exit', () => {
  const source = readSplash();

  assert.match(source, /type SplashPhase = 'assembling' \| 'ready' \| 'exiting'/);
  assert.match(source, /setPhase\('ready'\)/);
  assert.match(source, /setPhase\('exiting'\)/);
});

test('fragmented entry splash renders fragment layers for the assembly effect', () => {
  const source = readSplash();

  assert.match(source, /const fragments = \[/);
  assert.match(source, /fragments\.map/);
  assert.match(source, /backdrop-blur/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx tsx --test tests/fragmented-entry-splash.test.ts
```

Expected: FAIL because `tests/fragmented-entry-splash.test.ts` expects copy, phases, and fragment data not yet present in `components/SplashScreen.tsx`.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add tests/fragmented-entry-splash.test.ts
git commit -m "test: cover fragmented entry splash contract"
```

Expected: commit succeeds with only the new test file.

## Task 2: Implement Splash State Machine And Session Contract

**Files:**
- Modify: `components/SplashScreen.tsx`

- [ ] **Step 1: Replace the current timer-only state with explicit phases**

In `components/SplashScreen.tsx`, keep the imports and replace the component state with:

```tsx
type SplashPhase = 'assembling' | 'ready' | 'exiting';

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
    // UI is implemented in Task 3.
  );
}
```

- [ ] **Step 2: Keep TypeScript valid while the UI is temporarily minimal**

Use this temporary return until Task 3 replaces it:

```tsx
return (
  <AnimatePresence>
    {show && (
      <motion.div
        key="splash-screen-container"
        className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950"
      >
        <button type="button" onClick={enterSite}>
          进入宝藏之地
        </button>
        <a href="/login">登录 / 注册</a>
      </motion.div>
    )}
  </AnimatePresence>
);
```

- [ ] **Step 3: Run the targeted test**

Run:

```bash
npx tsx --test tests/fragmented-entry-splash.test.ts
```

Expected: still FAIL because fragment layers and final visual classes are not present yet.

## Task 3: Build Fragmented Entry UI

**Files:**
- Modify: `components/SplashScreen.tsx`

- [ ] **Step 1: Add fragment definitions above the component**

Add this before `export default function SplashScreen()`:

```tsx
const fragments = [
  { id: 'north-west', className: 'left-4 top-6 h-20 w-28 md:left-16 md:top-14 md:h-28 md:w-40', initial: { x: -120, y: -80, rotate: -18 }, exit: { x: -160, y: -120, rotate: -24 } },
  { id: 'north-east', className: 'right-5 top-10 h-16 w-24 md:right-20 md:top-20 md:h-24 md:w-36', initial: { x: 120, y: -90, rotate: 16 }, exit: { x: 150, y: -130, rotate: 26 } },
  { id: 'west', className: 'left-8 top-1/2 h-24 w-16 md:left-28 md:h-36 md:w-24', initial: { x: -150, y: 20, rotate: 12 }, exit: { x: -180, y: 40, rotate: -18 } },
  { id: 'east', className: 'right-8 top-1/2 h-24 w-16 md:right-28 md:h-36 md:w-24', initial: { x: 150, y: -20, rotate: -12 }, exit: { x: 180, y: -40, rotate: 18 } },
  { id: 'south-west', className: 'bottom-12 left-10 h-16 w-28 md:bottom-20 md:left-24 md:h-24 md:w-44', initial: { x: -100, y: 100, rotate: 20 }, exit: { x: -130, y: 130, rotate: 32 } },
  { id: 'south-east', className: 'bottom-10 right-10 h-20 w-24 md:bottom-24 md:right-28 md:h-28 md:w-40', initial: { x: 110, y: 110, rotate: -20 }, exit: { x: 140, y: 140, rotate: -34 } },
];
```

- [ ] **Step 2: Replace the temporary return with the final visual layer**

Use this return body:

```tsx
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
```

- [ ] **Step 3: Run the targeted test**

Run:

```bash
npx tsx --test tests/fragmented-entry-splash.test.ts
```

Expected: PASS.

## Task 4: Build And Deploy

**Files:**
- Modify: none beyond Task 3 output

- [ ] **Step 1: Run production build**

Run:

```bash
npm run build
```

Expected: build succeeds. The existing Turbopack NFT warning from `app/moments/page.tsx` may still appear and is not caused by this splash feature.

- [ ] **Step 2: Restart PM2**

Run:

```bash
pm2 restart xhblogs --update-env
pm2 save
pm2 status xhblogs
```

Expected: `xhblogs` is `online`.

- [ ] **Step 3: Verify HTTP health**

Run:

```bash
curl -sS -o /dev/null -w "local=%{http_code} %{time_total}\n" http://127.0.0.1:3000/
curl -sS -o /dev/null -w "public=%{http_code} %{time_total}\n" https://ayuu.fun/
```

Expected: both return `200`.

## Task 5: Commit Implementation

**Files:**
- Modify: `components/SplashScreen.tsx`
- Create: `tests/fragmented-entry-splash.test.ts`

- [ ] **Step 1: Check the final diff**

Run:

```bash
git diff -- components/SplashScreen.tsx tests/fragmented-entry-splash.test.ts
git status --short
```

Expected: only the splash component and new test are changed.

- [ ] **Step 2: Commit**

Run:

```bash
git add components/SplashScreen.tsx tests/fragmented-entry-splash.test.ts
git commit -m "feat: add fragmented entry splash"
```

Expected: commit succeeds.

