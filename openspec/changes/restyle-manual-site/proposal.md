# Proposal: restyle-manual-site

Unit 1 of epic `manual-overhaul` (`openspec/epics/manual-overhaul.md`).

## Why

Visitors arrive on a stock VitePress page in colours that aren't Studio's. The emoji feature
cards undersell the product, and links go to four different domains, some of them dead. Nothing
shows what Studio looks like or who it's for, so the manual doesn't win anyone over. The
published site may be stale too, because the docs deploy workflow is broken.

## What Changes

- The manual takes on Studio's look: the app's colour tokens, Roboto, and its surfaces, radii and
  accents. It opens in dark mode like the app, with a light mode built from the app's light
  tokens. Embedded `uk-*` controls render in their real colours.
- A new hero: product name and one-line pitch, a screenshot of the app over a soft light-beam
  backdrop, and calls to action for **Try the live demo**, **Download** (GitHub Releases) and
  **Read the manual**.
- A product presentation on the home page and in `introduction/`: what Studio is, who it's for,
  the main features with real screenshots, web vs desktop, open-source/GPL, and the project
  status.
- External URLs (demo, website, developer docs, repository, releases, discussions) are defined
  once in the site config and used everywhere. Unknown canonical values are TODO placeholders
  and the build lists them.
- The docs build passes, and `deploy.docs.yaml` installs dependencies and builds only the manual.

## Capabilities

### New Capabilities
- `user-manual`: the end-user manual site: look, home page, navigation, resource links. Later
  units add live previews, content coverage and upkeep.

### Modified Capabilities
None.

## Impact

- Code: `docs/manual/.vitepress/{config.js,theme/*}`, `docs/manual/index.md`,
  `docs/manual/introduction/*`, `docs/manual/public/*` (new screenshots). A tokens-only
  stylesheet split out of `src/assets/styles/global.css` (the app keeps importing the same
  values). `src/views/components/uikit/colors/uikit.colors.js` made safe outside a browser.
  `.github/workflows/deploy.docs.yaml`.
- Showfile format: none. Unsaved marker: none. Live playback/timing: none. WSC output: none.
  Visualizer: none. Web vs Electron: none (the app looks identical after the token split).
- Manual: this *is* the manual change: `index.md`, `introduction/index.md`,
  `introduction/overview.md`, `introduction/installation.md` (links only).

## Out of scope

- Live component previews (unit 2) and replacing videos.
- New or rewritten feature pages (units 3, 4). The current sidebar stays.
- Upkeep gates and the skill rewrite (unit 5).
- Choosing the canonical URLs: the user fills in the placeholders.
- A custom domain or hosting change.
