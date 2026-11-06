# Proposal: restyle-manual-site

Unit 1 of epic `manual-overhaul` (`openspec/epics/manual-overhaul.md`).

## Why

The manual is a stock VitePress site that looks nothing like Studio, undersells the product,
and links to four different domains. Its deploy workflow is broken. A first pass that
recoloured VitePress was rejected as generic (2026-11-05).

## What Changes

- **Built from Studio's interface**: a custom layout with Studio's toolbar (`uk-menu`), a
  patch-bay navigation panel (`uk-list`), pages in `uk-widget` containers, Studio icons,
  borders, fonts and tokens. Readable body text (about 15px), app density elsewhere. Dark by
  default.
- **A cinematic 3D hero** rendered live by Studio's visualizer: moving heads with volumetric
  beams that follow the cursor, colours that chase on the beat, and a camera that flies through
  the rig on scroll. It degrades on weak GPUs and shows a still for reduced motion or no WebGL.
- **No static screenshots**: product visuals are the hero now, and live components from unit 2.
- Introduction pages present the product: what it is, who it's for, how a show works, web vs
  desktop, open source.
- Resource URLs come from `.env` through one config. Unset ones are hidden and listed by the build.
- The docs build passes, and `deploy.docs.yaml` installs and builds only the manual.

## Capabilities

### New Capabilities
- `user-manual`: the end-user manual site: look, home page, navigation, resource links. Later
  units add live previews, content coverage and upkeep.

### Modified Capabilities
None.

## Impact

- Code: `docs/manual/.vitepress/{config.js,theme/*}` (custom layout, hero), `docs/manual/index.md`,
  `docs/manual/introduction/*`, `docs/manual/public/*` (unused media removed). A tokens-only
  stylesheet split out of `src/assets/styles/global.css` (the app keeps importing the same
  values). `src/views/components/uikit/colors/uikit.colors.js` made safe outside a browser.
  `.github/workflows/deploy.docs.yaml`. `src/plugins/visualizer/visualizer.js`: an opt-in
  showcase mode (no editor helpers, stats, orbit controls or saved quality) for the hero.
- Showfile format: none. Unsaved marker: none. Live playback/timing: none (the hero writes its
  own DMX frames, with no show and no Live clock). WSC output: none. Visualizer: showcase option
  only; the app's visualizer is unchanged. Web vs Electron: none.
- Manual: this *is* the manual change: `index.md`, `introduction/index.md`,
  `introduction/overview.md`, `introduction/installation.md` (links only).

## Out of scope

- Live component previews (unit 2), including the home page's product sections, and replacing
  videos.
- New or rewritten feature pages (units 3, 4). The current sidebar stays.
- Upkeep gates and the skill rewrite (unit 5).
- Choosing the canonical URLs: the user fills in the placeholders.
- A custom domain or hosting change.
