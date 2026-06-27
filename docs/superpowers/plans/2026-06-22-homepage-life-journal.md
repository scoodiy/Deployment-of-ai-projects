# Life Journal Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `ayuu.fun` homepage as a responsive, balanced life-journal layout without changing its content sources or routes.

**Architecture:** Keep `app/page.tsx` as the server-side composition and data-loading boundary. Rework the existing homepage-only presentation components so the profile, diary, photo, article, player, theme control, and site status each retain one clear visual role. Preserve the existing SQLite, Markdown, album, music-provider, and route integrations.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, PM2, Nginx.

---

## File Structure

- Modify: `app/page.tsx` - compose the revised 12-column desktop layout and single-column mobile order using existing server data.
- Modify: `app/globals.css` - introduce neutral homepage color tokens and the shared reduced-motion-safe surface styles.
- Modify: `components/ProfileCard.tsx` - turn the profile block into a compact editorial identity and statistics card.
- Modify: `components/LatestChatterCarousel.tsx` - show the current chatter as a readable diary card instead of a full-image hero.
- Modify: `components/LatestPostsCarousel.tsx` - show multiple recent posts as scan-friendly article cards while retaining existing links and empty-state routing.
- Modify: `components/CloudPlayer.tsx` - retain controls and music-provider logic while reducing the visual weight of the player.
- Modify: `components/ThemeToggleBlock.tsx` - align the theme control with the restrained surface system.

### Task 1: Establish homepage surface tokens

**Files:**
- Modify: `app/globals.css:8-39`

- [ ] **Step 1: Add neutral custom properties and a reusable homepage surface class**

Add light and dark variables for page background, text, border, muted text, and sage accent. Define `.home-surface` with an 8px radius, a one-pixel border, and a subtle shadow. Define `.home-surface:hover` without scaling the containing layout.

```css
:root {
  --home-bg: #f7f7f3;
  --home-text: #252a26;
  --home-muted: #687067;
  --home-border: #dedfd8;
  --home-accent: #64795a;
}

.home-surface {
  border: 1px solid var(--home-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--home-bg) 88%, white);
  box-shadow: 0 10px 30px rgb(35 42 38 / 6%);
}
```

- [ ] **Step 2: Preserve dark mode and motion accessibility**

Place dark variables under `.dark` and keep the existing `prefers-reduced-motion` block. Do not remove global prose, scrollbar, or form-control compatibility rules.

- [ ] **Step 3: Run static validation**

Run: `npm run lint`

Expected: command exits with code `0`.

- [ ] **Step 4: Commit the surface foundation**

```bash
git add app/globals.css
git commit -m "style: add life journal surface tokens"
```

### Task 2: Restyle profile, diary, and theme blocks

**Files:**
- Modify: `components/ProfileCard.tsx:9-109`
- Modify: `components/LatestChatterCarousel.tsx:8-77`
- Modify: `components/ThemeToggleBlock.tsx:6-36`

- [ ] **Step 1: Keep each component API unchanged**

Keep `ProfileCard({ postCount, chatterCount, photoCount })`, `LatestChatterCarousel({ chatters })`, and `ThemeToggleBlock()` signatures unchanged. Their existing click targets, copy-to-clipboard actions, carousel timing, empty state, and theme toggle must remain functional.

- [ ] **Step 2: Apply the shared surface to the profile card**

Replace the `rounded-3xl`, large gradient avatar frame, blurred background, and scale-on-hover styles with a `home-surface` container. Keep avatar, site title, bio, stats, and social buttons; use a compact avatar and a horizontal divider before the statistics row.

```tsx
<div className="home-surface h-full min-h-[300px] p-6 md:p-7">
  <div className="flex items-start gap-4">...</div>
  <div className="mt-6 border-t border-[var(--home-border)] pt-5">...</div>
</div>
```

- [ ] **Step 3: Convert chatter carousel copy into the diary focal card**

Preserve the current carousel state and link overlay, but use a light, text-led surface with a small `最新日记` label, title, date, two-line description, category-style metadata, and subdued indicator buttons. Do not use a background image or gradient overlay for this component.

- [ ] **Step 4: Simplify the theme control**

Keep click-to-toggle behavior, but replace the large animated gradient disc with a small sun/moon mark, current-mode title, and one-line descriptive copy. Use fixed minimum height so the neighboring row does not move when toggled.

- [ ] **Step 5: Run static validation**

Run: `npm run lint`

Expected: command exits with code `0`; no unused imports or client-component warnings appear.

- [ ] **Step 6: Commit the identity blocks**

```bash
git add components/ProfileCard.tsx components/LatestChatterCarousel.tsx components/ThemeToggleBlock.tsx
git commit -m "style: refine homepage identity blocks"
```

### Task 3: Make articles and music compact, readable modules

**Files:**
- Modify: `components/LatestPostsCarousel.tsx:8-78`
- Modify: `components/CloudPlayer.tsx:49-175`

- [ ] **Step 1: Replace the single large article image treatment with a recent-post list/grid**

Render up to four entries from `posts.slice(0, 4)`. Each entry must keep the existing fallback rule: numeric or `none` slugs link to `/timeline`; otherwise link to `/posts/${slug}`. Each card displays cover image, date, title, a two-line description, and existing category when present. Use a stable image aspect ratio and no automatic rotation.

```tsx
const articleHref = (slug: string) =>
  !slug || slug === 'none' || /^\d+$/.test(slug) ? '/timeline' : `/posts/${slug}`;
```

- [ ] **Step 2: Preserve player controls while reducing visual mass**

Keep the current music provider methods, loading state, empty-playlist state, `router.push('/music')`, progress seeking, previous, play/pause, and next behavior. Remove the decorative indigo blur sphere and reduce the artwork to a small square cover; keep its play-state rotation only when motion is allowed.

- [ ] **Step 3: Run static validation**

Run: `npm run lint`

Expected: command exits with code `0`.

- [ ] **Step 4: Commit compact content modules**

```bash
git add components/LatestPostsCarousel.tsx components/CloudPlayer.tsx
git commit -m "feat: compact homepage articles and player"
```

### Task 4: Recompose the homepage around balanced content

**Files:**
- Modify: `app/page.tsx:1-122`

- [ ] **Step 1: Preserve all server-side data reads and fallback objects**

Do not change `getPublishedPosts()`, chatter Markdown parsing, `publishedAlbums`, `chatterCount`, `realPhotoCount`, or the fallback objects. Continue deriving `top5Posts`, `top5Chatters`, and `latestAlbum` before JSX.

- [ ] **Step 2: Create the revised responsive order**

Use the following layout inside the existing `Navbar`, `PageTransition`, and `ToastProvider` wrappers:

```tsx
<main className="flex flex-col gap-5">
  {announcement}
  <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
    <div className="lg:col-span-4"><ProfileCard ... /></div>
    <div className="lg:col-span-4"><LatestChatterCarousel ... /></div>
    <Link className="lg:col-span-4 ...">{latestAlbum}</Link>
  </section>
  <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
    <div className="lg:col-span-8"><LatestPostsCarousel ... /></div>
    <div className="lg:col-span-4"><CloudPlayer /></div>
  </section>
  <LyricBar />
  <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
    <div className="lg:col-span-8">{photo wall entry}</div>
    <div className="lg:col-span-4"><ThemeToggleBlock /></div>
  </section>
  <SiteDashboard />
</main>
```

- [ ] **Step 3: Make the photo entry legible without a dark full-cover overlay**

Keep the `Link` to `/photowall` and current album cover. Use a fixed `aspect-[16/9]`, a light lower caption band, title, description, and a normal hover border/brightness transition. Do not use `hover:scale`, `rounded-3xl`, or a black gradient overlay.

- [ ] **Step 4: Run production validation**

Run: `npm run lint && npm run build`

Expected: both commands exit with code `0` and Next reports a successful production build.

- [ ] **Step 5: Commit the page composition**

```bash
git add app/page.tsx
git commit -m "feat: rebuild homepage as life journal"
```

### Task 5: Deploy and verify the live homepage

**Files:**
- No source files changed in this task.

- [ ] **Step 1: Restart the saved PM2 process after a successful build**

Run: `pm2 restart xhblogs --update-env && pm2 save`

Expected: PM2 reports `xhblogs` as `online`.

- [ ] **Step 2: Check server-local response**

Run: `curl -fsSI http://127.0.0.1:3000`

Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 3: Check public HTTPS response**

Run: `curl -fsSI https://ayuu.fun`

Expected: `HTTP/2 200` or `HTTP/1.1 200 OK`.

- [ ] **Step 4: Perform responsive visual inspection**

Open the public homepage at desktop width `1440x1000` and mobile width `390x844`. Confirm visible order is profile, diary, photo, articles, player, lyric bar, photo-wall entry, theme, then site status; confirm there is no horizontal page overflow, overlapping text, or blank image frame.

- [ ] **Step 5: Record final repository state**

Run: `git status --short && git log --oneline -5`

Expected: empty status output and commits for the completed homepage work.
