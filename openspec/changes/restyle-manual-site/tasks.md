# Tasks: restyle-manual-site

## 1. Baseline

- [ ] 1.1 On unit branch `docs/restyle-manual-site` off `epic/manual-overhaul`, run
      `npm run docs:manual:build` and record whether it passes and any error (expected suspect:
      `uikit.colors.js` touching `document` during SSR). Verify: the result is noted in this task
      before any edit.
- [ ] 1.2 Capture "before" screenshots of the app (`npm start`, demo showfile: universe view,
      group view with cues, chase view, visualizer) for the token-split comparison. Verify: the
      4 images are saved in the scratchpad.

## 2. UI: shared tokens (src/assets, uikit)

- [ ] 2.1 Move the `:root` and `[data-theme="light"]` custom-property blocks from
      `src/assets/styles/global.css` into a new `src/assets/styles/tokens.css`, and add
      `@import './tokens.css';` at the top of `global.css` (D1). Verify: `npm start`, then
      compare against the 1.2 screenshots in dark mode and with the visualizer popup's light theme
      if available; no visible difference.
- [ ] 2.2 Make `src/views/components/uikit/colors/uikit.colors.js` read tokens lazily through
      getters with a `typeof document` guard (D5). Grep `src/views/components/uikit` for other
      browser-only work at import and guard it. Verify: the colour picker and cue colours in
      the app still show the palette; `npm run docs:manual:build` gets past theme loading.

## 3. Docs: theme (docs/manual/.vitepress)

- [ ] 3.1 Rewrite `theme/custom.css` to map VitePress variables onto Studio tokens (D2), import
      `tokens.css` and `fonts.css` from `src/assets/styles`, and drop the hard-coded hex values.
      Verify: `npm run docs:manual:serve`; sidebar, body, code blocks and links use the app's
      colours and Roboto; `grep -E '#[0-9a-fA-F]{3,8}' docs/manual/.vitepress/theme/*.css` finds
      nothing except comments.
- [ ] 3.2 Set `appearance: 'dark'` in `config.js` and add the client-only `isDark` →
      `data-theme` sync in `theme/index.js` (D3). Verify: a first visit in a private window is
      dark; toggling to light and reloading keeps light with the app's light tokens.
- [ ] 3.3 Add `theme/asls-scope.css` and the `<StudioFrame>` component (D4), and register
      `<Video>` and `<StudioFrame>` globally. Verify: a scratch page embedding a `uk-button`,
      `uk-input-range-fader`, `uk-input-select`, `uk-input-checkbox` and `uk-widget` inside
      `<StudioFrame>` renders like the app in both modes, and its surrounding headings are
      unaffected. Delete the scratch page afterwards.

## 4. Docs: resource URLs

- [ ] 4.1 Add `MANUAL_URL_DEMO`, `MANUAL_URL_WEBSITE`, `MANUAL_URL_DEV_DOCS` and
      `MANUAL_URL_DOWNLOAD` to `.env` (download = `https://github.com/ASLS-org/studio/releases`,
      others empty). Load them in `config.js` with `loadEnv`, expose `themeConfig.links` with the
      fixed GitHub repository/discussions/issues URLs, and log the unset ones (D7). Verify:
      `npm run docs:manual:build` prints `manual: unset resource URLs: demo, website, dev-docs`
      and succeeds.
- [ ] 4.2 Add a `<ResourceLink to="…">` component. Build the nav from `themeConfig.links`, hiding
      unset entries. Replace every hard-coded Studio host in `docs/manual/**/*.md`. Verify:
      `grep -rnE 'asls\.io|timekadel\.com' docs/manual --include=*.md --include=*.js
      --include=*.vue` returns only `.env`-driven code; setting `MANUAL_URL_DEMO` to a test value
      makes the nav entry and the demo links appear.

## 5. Docs: home page and product presentation

- [ ] 5.1 Capture the home screenshots from the running app with the demo showfile (skill
      `run-studio`): full app, group/cue editing, effect editor, chase timeline, visualizer with
      beams, connections popup. Save them as `docs/manual/public/home/*.webp`, ≤1600 px wide,
      ≤250 kB. Verify: `ls -la docs/manual/public/home` shows the sizes.
- [ ] 5.2 Build `theme/components/home/` (`HomeHero`, `HomeFeatures`, `HomeWorkflow`,
      `HomePlatforms`, `HomeOpenSource`) and recompose `index.md` with them (D6). The hero has the
      name, the one-line pitch, the screenshot over a CSS beam backdrop, and the actions **Try the
      live demo** / **Download** / **Read the manual**. The feature cards cover patching, groups
      and cues, effects, chases, 3D visualizer, hardware output, web and desktop, and open source.
      Verify: at 1280×800 the name, pitch, screenshot and feature cards appear within one screen
      of scrolling; at 375 px everything stacks with no horizontal scroll; every action goes
      where the spec says.
- [ ] 5.3 Rewrite `introduction/index.md` (what Studio is, who it is for, use cases, the main
      features with links) and fill `introduction/overview.md` (a show's workflow end to end,
      web vs desktop, the gateway in one paragraph, open source, beta status). Fix the links in
      `introduction/installation.md`. Follow skill `user-manual` page style. Verify: in
      `docs:manual:serve`, every link on the three pages resolves (no 404, no dead-link warning
      in the build).
- [ ] 5.4 Remove the now-unused hero assets from `docs/manual/public` (old `hero.png`,
      `animated.*`, `overview.webm`, duplicate logos) only after a grep confirms no page or
      component references them. Verify: the grep for each removed file name returns nothing
      and the build passes.

## 6. CI

- [ ] 6.1 Fix `.github/workflows/deploy.docs.yaml`: `npm ci`, `npm run docs:manual:build`, upload
      `docs/manual/.vitepress/dist/`, no app build; triggers and `if:` unchanged (D8). Verify:
      `npx --yes @action-validator/cli .github/workflows/deploy.docs.yaml` (or a careful YAML
      review if unavailable), and in a fresh clone in the scratchpad `npm ci &&
      npm run docs:manual:build` succeeds.

## 7. Integration

- [ ] 7.1 Full pass: `npm run docs:manual:build && npx vitepress preview docs/manual`. Check
      every existing sidebar page in dark and light mode for unreadable text or broken media.
      Verify: no page has invisible text or a broken image, and the app (`npm start`) still
      looks like the 1.2 screenshots.

## 8. AI context and manual meta

- [ ] 8.1 Update skill `user-manual` (theme notes: tokens shared with the app, `<StudioFrame>`,
      `<ResourceLink>`, `.env` URLs, home components, no hard-coded hosts) and
      `docs/manual/CLAUDE.md`. Add `tokens.css` to `src/views/CLAUDE.md` (styling line) and to
      skill `vue-ui-change`. Verify: `grep -n tokens.css .claude/skills/*/SKILL.md
      src/views/CLAUDE.md` shows the new references.
- [ ] 8.2 Update the epic status table in `openspec/epics/manual-overhaul.md` for unit 1. Verify:
      the row reads `archived` after the archive step.
- [ ] 8.3 `npx eslint` on all touched `.js`/`.vue` files under `src/` and `docs/manual/.vitepress`
      is clean. Verify: the command exits 0.

## Workflow follow-up

- `/opsx:archive restyle-manual-site` in the unit branch, then a PR into `epic/manual-overhaul`.
- Ask the user for the canonical URLs to put in `.env` before the epic merges into `develop`.
