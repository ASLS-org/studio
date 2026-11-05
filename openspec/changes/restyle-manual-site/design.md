# Design: restyle-manual-site

## Context

See proposal.md (Why) and `openspec/epics/manual-overhaul.md` (Findings). The relevant facts:

- The app's tokens live in `src/assets/styles/global.css` (`:root` dark values,
  `[data-theme="light"]` overrides), next to global element rules (`*`, `body`, `h1`–`h4`,
  inputs). `global.scss` is not imported anywhere and is stale. The manual can't import
  `global.css` whole because those element rules would restyle VitePress.
- The theme (`docs/manual/.vitepress/theme/index.js`) registers every `uk-*` component in
  `enhanceApp`. VitePress runs `enhanceApp` during the server-side build too.
- `uikit/colors/uikit.colors.js` calls `getComputedStyle(document.documentElement)` at module
  load.
- VitePress marks dark mode with `html.dark`, while the app uses `html[data-theme="light"]`.
- The current brand gradient in `custom.css` (#A45BC9 → #5A71D3) is already `--accent-violet` →
  `--accent-blue`.

## Goals / Non-Goals

**Goals:** a single source of truth for tokens shared by the app and the manual; uikit controls
that look right inside pages; a custom home page; URLs configured in one place; a green build
and deploy.

**Non-Goals:** redesigning the app's tokens; a separate brand palette; live data in controls
(unit 2); new sidebar structure (units 3–4).

## Decisions

### D1. Split tokens into `src/assets/styles/tokens.css`
Move the `:root` and `[data-theme="light"]` custom-property blocks out of `global.css` into
`tokens.css`. `global.css` starts with `@import './tokens.css';` so `main.js` stays the same and
the app is pixel-identical. The manual imports `tokens.css` and `fonts.css` only.
*Alternatives:* copying the values into the manual (they would drift, which breaks the
"token change propagates" scenario); importing `global.css` under a CSS layer (its `*` and `h*`
rules still leak).

### D2. Map VitePress variables onto Studio tokens
`theme/custom.css` sets `--vp-c-bg`, `--vp-c-bg-alt`, `--vp-c-bg-soft`, `--vp-c-divider`,
`--vp-c-text-1..3`, `--vp-c-brand-1..3`, `--vp-c-brand-soft`, `--vp-code-*`, `--vp-font-family-base`
(`Roboto-Regular`) and `--vp-font-family-mono` from `var(--primary-*)`, `var(--secondary-*)` and
`var(--accent-*)`. It holds no hex values, except where an alpha variant must be derived, which
uses `color-mix()` on a token. The brand colour is `--accent-blue` and the gradient is
`--accent-violet` → `--accent-blue`. The same mappings hold in both modes because the tokens
themselves change.

### D3. One theme switch drives both systems
`config.js` sets `appearance: 'dark'` (dark by default, toggle kept, choice saved by VitePress).
A small client-only watcher in the theme (`useData().isDark`) sets
`document.documentElement.dataset.theme` to `'dark'` or `'light'`, so the app's
`[data-theme="light"]` tokens apply. No token is written twice.
*Alternative:* adding `html:not(.dark)` to the selector in `tokens.css` would leak VitePress
semantics into the app's stylesheet.

### D4. Isolate embedded controls with `vp-raw` + `asls-scope`
Pages wrap app components in `<div class="vp-raw asls-scope">`. `vp-raw` is VitePress's opt-out
from `.vp-doc` typography. `theme/asls-scope.css` replays the few app element rules the
controls rely on (`box-sizing`, `user-select`, the `h3`/`h4` widget headings, input focus),
nested under `.asls-scope`. A `<StudioFrame>` theme component does the wrapping, so authors
don't repeat the classes. Unit 2 builds `<LivePreview>` on it.

### D5. `uikit.colors.js` reads tokens lazily
Replace the eager object with getters that read the property on access and return `''` when
`document` is undefined. Same keys, same consumers. The values are read when a palette is built,
not per tick, so there's no real-time cost. The other uikit modules are also checked for
browser-only work at import; anything found gets the same lazy guard, or the theme registers the
uikit in a `typeof window` branch.

### D6. Custom home page from Vue components
`index.md` keeps `layout: home` with no `hero:`/`features:` frontmatter and composes
`<HomeHero>`, `<HomeFeatures>`, `<HomeWorkflow>` (patch → group → cue → chase → output, one line
each with a screenshot), `<HomePlatforms>` (web vs desktop) and `<HomeOpenSource>` (license,
repository, discussions, contributing) from `theme/components/home/`. The hero backdrop is
pure CSS (two or three soft radial gradients in accent colours, a nod to beams), with no WebGL,
so the page loads fast. The screenshots are captured from the running app with the demo showfile
(skill `run-studio`), as `public/home/*.webp`, max width 1600 px, under 250 kB each. Feature
cards use `uk-icon` glyphs, not emoji.

### D7. Resource URLs from the repo `.env`
`.env` (committed, public URLs only, as `CLAUDE.md` says) gains `MANUAL_URL_DEMO`,
`MANUAL_URL_WEBSITE`, `MANUAL_URL_DEV_DOCS` and `MANUAL_URL_DOWNLOAD` (empty for now, except
download = GitHub Releases). The repository, discussions and issues values are fixed GitHub URLs.
`config.js` reads them with Vite's `loadEnv` and exposes `themeConfig.links`. When a value is
empty, it logs `manual: unset resource URLs: demo, website, …` and the link falls back:
- the nav item is hidden;
- `<ResourceLink to="demo">` renders plain text with the title "Link coming soon";
- a hero action is hidden, except **Read the manual**, which is always internal.
Pages never hard-code those hosts again. A `grep` task enforces it.

### D8. Deploy workflow fix only
`deploy.docs.yaml`: `npm ci` → `npm run docs:manual:build` → upload
`docs/manual/.vitepress/dist/`. Drop the app build step. Triggers and the `if:` guard stay as they
are; when the manual deploys is the maintainer's call.

## Risks / Trade-offs

- [Some uikit control depends on a global rule not replayed in `asls-scope`] → the unit 1 tasks
  check one of each control family on a test page in both modes; the missing rule gets added to
  `asls-scope.css`.
- [`@import` in `global.css` changes cascade order in the app] → the tokens are custom properties
  only, so order doesn't matter; verified by comparing screenshots of the app before and after.
- [Hidden CTAs while URLs are unset make the hero look thin] → **Download** and **Read the
  manual** always work. The build log reminds the maintainer.
- [Roboto TTFs add weight] → load only Regular, Medium and Bold, as the app does, with
  `font-display: swap` in the manual's `@font-face` usage.

## Migration Plan

Docs-only plus a no-op stylesheet split. Rollback = revert the branch. The deploy change takes
effect on the next push to `staging`.

## Open Questions

- Canonical URL values (the user fills in `.env`; nothing else depends on them).
