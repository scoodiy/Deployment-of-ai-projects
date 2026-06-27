# Fragmented Entry Splash Design

## Goal

Replace the current simple splash screen with a more ceremonial entry animation for ayuu.fun. The experience should feel like a page assembling itself from translucent fragments, then dispersing when the visitor chooses to enter.

This is an entry layer, not an authentication gate. Visitors can enter the site without logging in. The existing `/login` page remains the real login and registration flow.

## User Experience

### First Visit In A Browser Session

1. The site content stays hidden behind the global splash layer.
2. A dark, softly blurred overlay appears, with a faint hint of the site background behind it.
3. Several glass-like fragments fly in from different directions.
4. The fragments settle into a centered entry card.
5. The avatar, site title, short subtitle, and buttons fade in.
6. The visitor can choose:
   - `进入宝藏之地`: disperse the card and reveal the home page.
   - `登录 / 注册`: navigate to the existing `/login` page.

### Enter Animation

When the visitor clicks `进入宝藏之地`:

1. The assembled card splits into several visual fragments.
2. Fragments move outward with slight rotation, blur, and opacity fade.
3. The background overlay fades out.
4. The hidden app root becomes visible by applying the existing `splash-seen` class to `<html>`.
5. `sessionStorage.hasSeenSplash` is set to `true` so the animation does not repeat in the same browser session.

### Returning During The Same Session

If `sessionStorage.hasSeenSplash` is already `true`, the splash layer should not render. The app root should become visible immediately through the existing `beforeInteractive` script in `app/layout.tsx`.

## Visual Direction

- Mood: glass, soft glow, quiet anime-inspired entrance.
- Palette: keep the site's current dark indigo / purple / slate feeling, with subtle cyan or violet highlights.
- Card: centered, translucent, bordered, backdrop-blurred.
- Motion: smooth and readable, not chaotic.
- Copy:
  - Title: site title or author name from `siteConfig`.
  - Subtitle: short welcome line, for example `正在拼装通往宝藏之地的入口`.
  - Primary button: `进入宝藏之地`.
  - Secondary link: `登录 / 注册`.

## Mobile Behavior

Mobile should be simpler and calmer:

- Card width: about 88vw, with safe vertical spacing.
- Fragment count: fewer than desktop, around 5.
- Travel distance: shorter than desktop.
- Buttons stack or remain compact depending on available width.
- No text should overflow the card.

## Architecture

### Components

Primary implementation target:

- `components/SplashScreen.tsx`

Optional supporting changes:

- `app/layout.tsx` only if the existing app visibility class needs minor timing adjustments.

No changes are planned for:

- `app/login/page.tsx`
- user authentication APIs
- admin pages
- home page content

### State

`SplashScreen` should keep a small internal state machine:

- `booting`: component has mounted, fragments start assembling.
- `ready`: card is assembled and waiting for visitor input.
- `exiting`: visitor clicked enter, fragments disperse.
- `done`: splash is removed and the site is visible.

The component may implement this with `useState` values such as `isMounted`, `phase`, and `show`.

### Routing

- `进入宝藏之地` does not navigate. It only completes the splash.
- `登录 / 注册` navigates to `/login`.

## Error Handling And Accessibility

- If JavaScript runs normally, the splash always reveals the site after the visitor clicks enter.
- If a user has reduced motion enabled, animations should be shortened and simplified where practical.
- Buttons must be real `<button>` or accessible links.
- The entry layer should have clear text labels and should not trap focus longer than necessary.

## Performance

- Use CSS transforms, opacity, and filters only.
- Avoid canvas, large SVG filters, or heavy image assets.
- Keep fragment elements as lightweight `motion.div` blocks.
- Do not add a new animation library; use the existing `framer-motion` dependency.

## Verification

After implementation:

1. Run `npm run build`.
2. Restart PM2 for the live site.
3. Verify `https://ayuu.fun` returns HTTP 200.
4. In a clean browser session or after clearing `sessionStorage.hasSeenSplash`, confirm:
   - fragments assemble into the entry card;
   - clicking `进入宝藏之地` disperses the card;
   - the home page becomes visible;
   - refreshing in the same session skips the splash.
5. Verify `/login` still works through the secondary link.

