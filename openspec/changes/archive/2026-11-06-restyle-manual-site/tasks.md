# Tasks: restyle-manual-site

Revised 2026-11-05 after review (design.md § Revision). Ticked tasks from the first pass still
hold. Verification screenshots stay in the session scratchpad; none ships in the manual.

## 1. Baseline

- [x] 1.1 On unit branch `docs/restyle-manual-site`, run `npm run docs:manual:build` and record
      the result. Result: passes. `uikit.colors.js` isn't reached, because only models and
      `color.mixin.js` import it.
- [x] 1.2 Capture "before" screenshots of the app (universe, group, chase views, dark and light)
      in the scratchpad, for the token-split comparison.

## 2. UI: shared tokens (src/assets, uikit)

- [x] 2.1 Move the token blocks into `src/assets/styles/tokens.css` and `@import` it from
      `global.css` (D1). Verified: the app's panels are pixel-identical to 1.2 in both themes.
- [x] 2.2 Make `uikit.colors.js` read tokens lazily (D5). Verified: group, universe and cue
      colours resolve in the running app.

## 3. Docs: theme foundations (kept from the first pass)

- [x] 3.1 Load tokens and fonts in the theme (`custom.css` imports `tokens.css`, `fonts.css`).
      Verified: no hex colours in the theme CSS.
- [x] 3.2 Dark by default, with `html[data-theme]` kept in sync with VitePress's `isDark` (D3).
      Verified in both modes.
- [x] 3.3 `asls-scope.css` and `<StudioFrame>`, plus `<Video>` registered (D4). Verified:
      controls render as in the app in both modes.

## 4. Docs: resource URLs (kept)

- [x] 4.1 `MANUAL_URL_*` in `.env`, loaded in `config.js`, unset ones logged (D7).
- [x] 4.2 `<ResourceLink>`, nav from `themeConfig.links`, no hard-coded Studio hosts. Verified
      with grep and a test `MANUAL_URL_DEMO`.

## 5. Docs: Studio shell (D2)

- [x] 5.1 Remove the first-pass look: delete `theme/components/home/*`, `theme/home.css` and
      `public/home/*`, drop the screenshot from `introduction/index.md`, and cut `custom.css` down
      to token/font imports plus the `--vp-*` values VitePress internals still read (search
      box, code). Verify: `grep -rn "home/.*webp\|HomeHero" docs/manual --include=*.md
      --include=*.js --include=*.vue` returns nothing, and the build passes.
- [x] 5.2 Add `theme/Layout.vue` (extends `DefaultTheme`, replaces its `Layout`) with the
      shell regions: a top bar from a real `uk-menu` fed by the sidebar config (sections as
      menus, pages as items with icons), a centred page title, and SEARCH / DARK-LIGHT / GITHUB
      as `uk-button`s. Verify: in `docs:manual:serve`, every menu opens on click, highlights on
      hover, closes on pick and routes to the page; SEARCH opens the local search; DARK/LIGHT
      switches the theme.
- [x] 5.3 Left panel as the patch bay: "MANUAL" header plus a real `uk-list` (`accordion`,
      `filterable`, `colored`, sections as coloured entries with their pages unfolded). The
      current page is selected and selecting an item routes to it. Verify: filter by typing,
      fold and unfold sections, click pages; typing in the filter doesn't trigger list or menu
      keyboard shortcuts (if it does, apply the minimal fix noted in D2 and record it here).
      Result: filtering "chase" leaves Modifiers → Chase; typing doesn't open search or
      trigger list or menu shortcuts (uk-list only handles Escape/Delete; uk-menu binds no
      shortcuts here). No uikit change needed.
- [x] 5.4 Page in a `uk-widget` (header icon from frontmatter `icon` or the section default, and
      the uppercase title) and an "On this page" `uk-widget` with the outline. Prev/next as
      `uk-button`s, and the footer line. Verify: every existing page renders inside its widget,
      outline links scroll to their headings, prev/next follow the sidebar order.
- [x] 5.5 `theme/prose.css` under `.studio_prose`: 15px/1.65 body, Studio heading system,
      Studio-list tables, `--primary-dark` code blocks, popup-style custom blocks (tip, warning,
      info), `<kbd>` as a small Studio button. Verify: the measured body font-size is ≥ 15px and
      line-height ≥ 1.6 (computed style), and every existing page's tables, code, blocks and
      videos render without overflow at 1280 and 375 px.
      Result: computed 15px / 24.75px (1.65). Fixed on the way: list markers (VitePress resets
      them) and indented code on the license page overflowing at 375px.
- [x] 5.6 Narrow screens: under 960px the left panel becomes a drawer opened by a MANUAL toolbar
      button, and the outline widget is hidden. Verify at 375 px: no horizontal page scroll, and
      the drawer opens, routes and closes.

## 6. Visualizer: showcase mode (D6)

- [x] 6.1 Add `new Visualizer(canvas, { showcase, quality })` in `visualizer.js`: when
      `showcase`, skip Stats, grid, axes, OrbitControls, TransformControls, the checkerboard
      (use a dark matte receiver floor instead) and `localStorage` quality reads and writes, and
      use the given quality. Defaults keep the app unchanged. Verify: `npm start`, the app's
      visualizer looks like the 1.2 screenshots, with grid, axes, gizmo and orbiting all
      working; lint clean on the new lines.
      Result: the app's visualizer still has its checkerboard, grid, axes and gizmo; panels are
      pixel-identical to 1.2 (differences only inside the animated viewport).

## 7. Docs: 3D hero (D6)

- [x] 7.1 Hero rig module (`theme/hero/rig.js`): build patch entries for about 22 moving heads
      (two curved trusses and a floor row) from one moving-head profile loaded through the
      fixture library, or from an embedded minimal channel list if the library can't load in the
      manual (record which). One owned `Uint8Array(512)` frame. Verify: a scratch page mounts the
      showcase visualizer with the rig, and every head lights at full dimmer.
      Result: loaded through the fixture library (`FixtureLibrary.getProfile('ofl', 'martin',
      'mac-aura')`), 14-channel Standard mode. Rotations are radians (x = π hangs a head).
- [x] 7.2 Choreography (`theme/hero/choreography.js`): pointer aim (raycast to the floor, eased,
      ≤ 0.5 s), idle sweep after 2 s, a 120 BPM colour and dimmer chase in Studio's accents with a
      flash every 4 bars, no allocation per frame. Verify: beams follow the pointer; with the
      pointer out, they sweep; the colour changes every bar (2 s).
- [x] 7.3 Scroll camera: a sticky 200vh hero with the camera on a spline (front low → through the
      trusses → top-down) driven by scroll progress. Verify: scrolling from 0 to the end of the
      hero moves the camera smoothly both ways, then the page continues.
- [x] 7.4 `HomeHero.vue`: full-bleed canvas, headline (name in the accent gradient, a pitch
      line), the three CTAs (hidden when unset), and a vignette and grain overlay. Dynamic import
      on mount, IntersectionObserver plus `visibilitychange` pause, dispose on unmount.
      Verify: off screen and in a hidden tab, the frame count stops increasing; navigating away
      and back leaves no second WebGL context (`renderer.info`, console).
- [x] 7.5 Tiers and fallbacks: Medium on desktop, Low on mobile or with `deviceMemory` ≤ 4,
      render scale 0.75. Reduced motion renders one frame and stops; no WebGL shows the CSS
      backdrop. Verify with Chrome flags (`--force-prefers-reduced-motion`, `--disable-webgl`)
      that no console errors appear; record the hero's transferred JS size and the median frame
      time at 1280×800 in this task.
      Result: production hero chunk 909 kB (245 kB gzip), loaded only on the home page after
      mount. Reduced motion: still class, 0 frames in 1.5 s. No WebGL: fallback class, no
      canvas, no errors. Frame time on real GPUs not measured here (headless software GL
      renders ~13 fps); to check on the 2015-laptop target before release.

## 8. Docs: home page and product presentation

- [x] 8.1 Home sections below the hero (D9) built from `uk-widget`s: what it is, how a show comes
      together, web or desktop, open source with the resource links. Text only, with a marked
      slot per section for unit 2's live component. Verify: at 1280 and 375 px nothing overflows,
      and every link resolves (link crawl).
- [x] 8.2 Rewrite `introduction/index.md`, fill `introduction/overview.md`, and fix the
      installation links (first pass). Re-check after 5.1 removes the screenshot: the pages read
      correctly without it.
- [x] 8.3 Remove unused hero assets from `docs/manual/public` (first pass, 68 MB).

## 9. CI

- [x] 9.1 `deploy.docs.yaml`: `npm ci`, build the manual only (D8). Verified in a clean copy.

## 10. Integration

- [x] 10.1 Full pass on the production build (`vitepress build` + `preview`): every sidebar
      page in dark and light at 1280 and 375 px, with no broken media, no console errors, and
      videos playing. Verify: the scripted pass reports no problems, and the app (`npm start`)
      still matches the 1.2 screenshots.

## 11. AI context and manual meta

- [x] 11.1 Update skill `user-manual` (Studio shell: layout regions, frontmatter `icon`,
      `prose.css`; hero; no screenshots as product imagery; live components from unit 2),
      `docs/manual/CLAUDE.md`, `src/plugins/visualizer/CLAUDE.md` (showcase option),
      `src/views/CLAUDE.md` and skill `vue-ui-change` (tokens; done). Verify: grep shows the new
      sections.
- [x] 11.2 Update the epic doc: unit 1's status, unit 2 now also fills the home page's live
      slots. Verify: the row reads `archived` after archive.
- [x] 11.3 `npx eslint --ext .js,.vue --ignore-pattern '!docs/manual/.vitepress'` on every
      touched file is clean. Verify: exit 0.

## Workflow follow-up

- `/opsx:archive restyle-manual-site` in the unit branch, then a PR into `epic/manual-overhaul`.
- Ask the user for the canonical URLs to put in `.env` before the epic merges into `develop`.
- Note for the epic: the app's **About → Manual** opens `https://studio.asls.timekadel.com/`
  (hard-coded in `toolbar.fragment.vue`).
