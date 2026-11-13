---
name: user-manual
description: Keep the end-user manual (docs/manual, VitePress) in sync with the app. Use after any change that alters what users see or how they use Studio (new feature, changed interaction, renamed control, new setting, removed behaviour), when writing or reviewing manual pages, or when archiving an OpenSpec change with user-facing impact.
---

# User manual (docs/manual)

The manual explains **how to use the app**: what each screen and control does, and how to get a
lighting job done. It is not developer documentation.

| Belongs in the manual | Does not belong |
|---|---|
| What a widget, setting or button does | Class names, files, APIs, code |
| Step-by-step workflows (patch → group → scene → chase → output) | Architecture, data flow, protocols on the wire |
| Units, ranges, defaults as the user sees them | Implementation limits users can't act on |
| Keyboard shortcuts, mouse gestures | Build, contribution, or AI notes |
| Known limitations that affect use ("only moving heads are visualized") | Internal TODOs |

Developer docs live elsewhere (JSDoc/docma, `CLAUDE.md`, OpenSpec specs).

## When to update

Update it in the **same PR** as the code whenever a change:
- adds, removes, or renames a visible control, setting, popup, or screen region,
- changes a workflow, gesture, shortcut, default, or unit,
- adds a capability users must learn (new output protocol, new effect type, file import…).

Pure refactors, perf work and invisible fixes need no manual update. Say so in the PR
("Manual: n/a").

## Coverage map

Which manual pages and live preview presets each part of Studio feeds. Look up every file a
change touches: the pages are what the proposal's **Manual** line names, and the presets are what
`npm run docs:manual:check` must pass for. `F` = `src/views/activities/app/fragments`, `M` =
`src/models`. Keep this table current when views, pages or presets are added, moved or renamed.

| Source | Pages | Presets |
| --- | --- | --- |
| `F/toolbar/toolbar.fragment.vue` (menus, show name, clock) | `getting-started/interface#toolbar`, `reference/shortcuts` | `toolbar-menus`, `toolbar-file` |
| `F/toolbar/_popups/popup.newshow.vue`, `popup.saveas.vue`, `M/DMX/show.model.js` (save, load, export, templates) | `rig/showfiles` | `toolbar-file` |
| `F/toolbar/_popups/popup.connections.vue`, `F/modifiers/universe/_widgets/universe.modifier.widget.connection.vue`, `src/plugins/wsc.connection.js`, `M/DMX/output.pool.model.js`, the bundled gateway (`src/electron/`) | `rig/outputs`, `reference/troubleshooting`, `reference/limitations` | `outputs-popup`, `universe-stream` |
| `F/toolbar/_popups/popup.visualizer.vue` | `interface/visualizer#settings` | `visualizer-settings` |
| `F/toolbar/_popups/popup.license.vue`, `popup.credits.vue` | `introduction/license` | none |
| `F/patch-bay/` (fragment, `_popups/popup.media.vue`) | `getting-started/interface#patch-bay`, `programming/patching` | `patch-bay`, `patch-bay-new`, `patch-bay-select`, `patch-bay-filter`, `visualizer-modes` |
| `F/modifiers/universe/universe.modifier.fragment.vue`, `_popups/universe.modifier.popup.patch.vue` | `programming/patching`, `rig/fixtures` | `patch-add`, `universe-stream` |
| `F/modifiers/universe/_widgets/universe.modifier.widget.settings.vue` | `programming/patching` | `universe-settings` |
| `F/modifiers/universe/_widgets/universe.modifier.widget.fixture.settings.vue` | `programming/patching` | `fixture-settings` |
| `F/modifiers/universe/_widgets/universe.modifier.widget.fixture.position.tool.vue` | `programming/patching`, `interface/visualizer#placing-fixtures` | `fixture-position` |
| `F/modifiers/_widgets/modifier.widget.fixture.pool.vue` | `programming/patching`, `programming/groups` | `fixture-pool-delete`, `group-fixture-pool-delete` |
| `F/modifiers/_widgets/modifier.widget.fixture.channels.vue`, `colorpicker`, `pantilt`, `cells`, `curve` (via the theme's `previews/FixtureControl.vue`) | `programming/patching`, `programming/scenes` | `fixture-channels`, `fixture-color`, `fixture-pantilt` |
| `F/group-pool/` (fragment, `_popups/popup.group.vue`), `M/DMX/master.model.js` | `getting-started/interface#group-pool`, `programming/groups`, `programming/playback` | `group-pool`, `group-pool-new`, `chase-play`, `master-row` |
| `F/modifiers/group/group.modifier.fragment.vue`, `_widgets/group.modifier.widget.settings.vue`, `_popups/group.modifier.popup.patch.vue`, `M/DMX/group.model.js` | `programming/groups`, `getting-started/interface#modifier-strip` | `group-modifier`, `group-settings` |
| `F/modifiers/group/_widgets/group.modifier.widget.cuepool.vue`, `_popups/group.modifier.popup.cuepool.vue` | `programming/scenes`, `programming/effects`, `programming/playback` | `group-cuepool`, `cuepool-add`, `scene-stage`, `effect-stage` |
| `F/modifiers/group/_widgets/group.modifier.widget.cue.settings.vue`, `M/DMX/cue.model.js` | `programming/scenes` | `cue-settings` |
| `F/modifiers/group/group.scene.modifier.fragment.vue`, `group.scene.modifier.widget.*`, `M/DMX/scene.model.js`, `fade.model.js` | `programming/scenes` | `scene-modifier`, `scene-curve` |
| `F/modifiers/group/group.effect.modifier.fragment.vue`, `group.effect.modifier.widget.*`, `group.effect.modifier.popup.channels.vue`, `M/DMX/effect*.model.js` | `programming/effects` | `effect-wave`, `effect-channel-add` |
| `F/modifiers/chase/`, `M/DMX/chase*.model.js`, `cue.item*.model.js` | `programming/chases` | `chase-modifier`, `timeline-add` |
| `M/DMX/live.model.js`, `src/worker.js` (BPM, bars, quantize, play/pause) | `concepts/timing`, `programming/playback` | `chase-play`, `master-row` |
| `M/DMX/*.pool.model.js`, `universe.model.js`, `fixture.model.js` (what a show holds) | `concepts/index`, `introduction/overview` | none |
| `F/visualizer/`, `src/views/activities/visualizer/`, `src/plugins/visualizer/` | `interface/visualizer`, `reference/limitations#visualizer` | `visualizer-modes`, every `stage: true` preset (the floating card) |
| `M/fixtures/`, `public/fixtures/`, `public/gdtf/` | `rig/fixtures`, `programming/patching` | `patch-add` |
| `src/views/activities/app/_popups/` (error, missing fixtures, splash) | `reference/troubleshooting` | none |
| `src/views/components/uikit/` (lists, fields, popups, widgets) | `getting-started/interface#widgets`, `reference/shortcuts` | all (run the check) |
| any `keydown` handler or menu shortcut | `reference/shortcuts` | the preset of that component |
| `src/electron/`, `electron-builder` config, release artifacts | `introduction/installation` | none |
| any step of the first-show flow: patch, group, scene, chase, play (labels, order, defaults) | `getting-started/first-show` | none |
| a behaviour that doesn't work (found or fixed) | `reference/limitations` (+ the epic backlog) | none |
| a new term in the UI | `reference/glossary` | none |

The theme's own files (`docs/manual/.vitepress/theme/previews/*`, `components/LivePreview.vue`,
`public/presets/manual.showfile.json`) feed every preset: run the check after changing them.

## Structure

```
docs/manual/
  index.md                       home page (theme/hero/HomeStory.vue, no prose here)
  introduction/                  about (product presentation), overview ("How Studio works": a
                                 short narrative linking each topic), installation (browser or
                                 desktop app: downloads, first launch, built-in gateway), license
  getting-started/               first-show (tutorial steps, no previews: each step links the page
                                 with the demo), interface (the map: regions, toolbar, one panel)
  concepts/                      index (show structure: what owns what), timing (BPM, bars,
                                 quantize, playback)
  programming/<task>.md          one page per task, in build order: patching, groups, scenes,
                                 effects, chases, playback
  rig/<topic>.md                 Rig & output: fixtures (library, GDTF, missing fixtures, 3D,
                                 cells, channel types), outputs (gateway, connections, streams,
                                 what's verified), showfiles
  interface/visualizer           Rig & output too (kept at its old URL)
  interface/toolbar              stub → getting-started/interface#toolbar
  reference/<page>.md            shortcuts, glossary, troubleshooting, limitations
  interface/{patchbay,grouppool,modifier}, modifiers/*, workflow/*
                                 one-line "This page moved" stubs (old URLs keep working; not in
                                 the sidebar; remove in a later release)
  public/presets/manual.showfile.json   the live previews' demo show
  _dev/*.md                      dev-only check pages (behaviour, visualizer), never built
  .vitepress/config.js           sidebar (add every new page here), resource links
  .vitepress/theme/              Studio shell, live previews, home story
```

Sidebar sections, in order: **Getting started**, **Concepts**, **Programming a show**, **Rig &
output**, **Reference** (accent and icon per section and page in `theme/shell/nav.js`).

**One home per topic.** Each topic is explained once, on its home page, with its preview, demo or
illustration; other pages say it in a sentence and link there. Every preset and illustration
appears on exactly one page (check: count `<LivePreview preset>` and illustration tags across the
pages). Don't add a whole-panel preview to a page that already shows its widgets one by one (the
group view on The Interface is the one panel example). Concepts define and link; the tutorial
gives steps and links; Reference pages look things up.

**Reference pages are kept true:**
- `reference/shortcuts` lists only keys checked in the app; a change to a key binding or menu
  shortcut updates it.
- `reference/limitations` holds every Studio behaviour the manual doesn't present as working,
  with its workaround. Feature pages describe what works and may link there; a fix removes the
  row, a new bug found while documenting adds one.
- `reference/glossary` gets a row for any new term a page relies on.
- `reference/troubleshooting` is symptom → cause → fix.

**Output docs:**
- Describe the gateway in user terms.
- Mark a protocol as working only after streaming it end to end (gateway + a receiver, e.g. a
  UDP listener for Art-Net on 6454).
- Update **What's verified** on `rig/outputs` when the gateway (`WSC_VERSION`) changes.
- Output demos never press **connect** or **Start streaming**.
- The preview host drops demo outputs before reloading the show (`OutputPool.clearAll` throws
  once an output exists).

### Theme: the manual is built from Studio's interface

The look is Studio itself, not a recoloured docs theme (a VitePress reskin was rejected on
2026-11-05). `theme/shell/Layout.vue` replaces VitePress's layout and is made of real uikit
components:

| Region | Built like | Notes |
|---|---|---|
| Top bar (48px) | Studio's toolbar | left block = logo cell (48px) + `shell/ManualSearch.vue` (an input-style field, "Search" and the shortcut, opens VitePress local search; also Ctrl/⌘K or `/`), 280px wide so its border lines up with the left panel's; right: VIEW ON GITHUB, TRY LIVE DEMO, DOWNLOAD (icons `opensource`, `play`, `export`; unset URLs hidden). No menus, no page title |
| Content section of the toolbar | Fills the toolbar between search and actions | `shell/ManualContentBar.vue`: breadcrumb (pages only) (section dot + name / page), THEME segmented control Light / Dark / System (stored in `localStorage` `asls-manual-appearance`, System follows the OS live; the boot script in `config.js` applies it before paint), EDIT PAGE (GitHub edit link on `develop`, pages only). Under 768px it leaves the toolbar and its theme control sits at the top of the page drawer |
| Left panel | The patch bay's place | `shell/ManualNav.vue`: each section titled (bold uppercase) with its accent dot, no separator or extra gap between sections, pages as lighter `uk-list-item` rows in the opt-in `large` mode, no row separators; the current page gets a tint of its section's colour with its label and icon in that colour |
| Page | Plain article on `--primary-light` | no widget header, no kicker (the content bar shows where you are); custom prev/next cards (light `--secondary-darker` panels, section-coloured kicker, own inline chevrons) |
| Right | "On this page" | `shell/ManualOutline.vue`: plain title (no dot), h2/h3 as quiet `large` rows (h3 indented); the section in view is written in the current section's colour (text only), the last one at the bottom of the page (hidden < 1280px) |
| Bottom | App footer | a Studio bar under everything (pages and home): brand, version (last release tag via `git describe`, else package.json; the docs deploy fetches tags), license link, "Made with ♥ by Timé Kadel" |

Review feedback that shaped it (2026-11-05/06): no redundant chrome (toolbar menus, page title,
page header widget); **nothing glows** (no glowing dots, no coloured shadows); no invented
decoration on the app's own components; extend the kit with
opt-in modes instead of restyling existing components; accents are welcome where they carry
meaning (section dots and colours, callout types). In `prose.css`, tables, callouts, code and
quotes are darker panels with Studio's small 4px radius (`--prose-panel`: `--primary-dark`, a lighter token in light
mode) on the `--primary-light` page; headings follow a 36/24/18/15/12/11px scale. Tables aren't interactive: no hover styling.

- **Sections and icons**: `shell/nav.js` (section colour = accent token, page icon by link).
  A page can override its icon with frontmatter `icon: <uk-icon name>`. Add new pages to the
  sidebar in `config.js` and give them an icon in `nav.js`.
- **Prose**: `theme/prose.css`, under `.asls-scope .studio_prose`. Body 15px/1.65, h2 16–20px
  Roboto-Regular with a separator, h3 12px bold uppercase (widget-header style), tables as
  Studio lists, callouts as popups, `<kbd>` as small Studio buttons.
- **Colours are Studio's tokens.** `custom.css` imports `src/assets/styles/tokens.css`, the
  app's fonts and the few `--vp-*` values VitePress's search box still reads. Never put colour
  values in the shell or prose CSS. Use only tokens defined in both themes (the `*-alt` text
  tokens have no light value).
- **Dark by default, light optional.** `appearance: 'dark'`; the theme mirrors VitePress's
  `isDark` onto `html[data-theme]`, which switches the tokens.
- **`asls-scope`** (on the shell root) replays the app's element rules (`asls-scope.css`), so
  uikit components look exactly as in the app. Anything of your own inside the shell that is a
  paragraph needs `display: block` (the app's `p` is a flex row).
- **Embedding app controls in a page**: wrap them in `<StudioFrame caption="…">` (`vp-raw` +
  the scope), or use a live preview (below). `prose.css` element rules skip `.vp-raw` blocks
  (`:not(.vp-raw, .vp-raw *)` on every rule's last element) and `.asls-scope` resets the
  inherited font size to 16px: keep both when adding prose rules, or Studio components inside a
  page pick up the manual's headings and paragraphs.
- **No screenshots of the app as product imagery.** Product visuals are live: the 3D hero and
  real Studio components and demos. No recordings either: a flow is shown as a demo, a concept
  as an illustration (`theme/components/`).
- **Global components** (`theme/index.js`): every `uk-*`, `<Video src>` (unused, kept for a
  future need), `<StudioFrame>`, `<LivePreview preset>`, `<ResourceLink to>`, `<HomeStory>`,
  `<ShowMap>`, `<SceneFade>`, `<EffectWave>`, `<CellsBar>`.

### Live previews

`<LivePreview preset="group-cuepool" caption="…" />` mounts a **real** Studio widget or panel,
working on the demo show: readers move faders, trigger cues, watch effects and chases run.
Flows to watch rather than try are **demos**: a cursor plays them on the real component.
- **Studio's proportions**: every preset shows its component at its size in Studio (the modifier
  strip is 239px tall in a 1440×900 window and each widget keeps its own width; patch bay and
  group pool 620px tall), on Studio's idle stripes (`--idle-stripes`), scaled down whole to fit
  (`fit: 'scale'`) or scrolling sideways (`fit: 'scroll'`, modifier panels). Measure a new
  widget in Studio with the demo show before adding its preset; never stretch a widget to the
  page width.
- **Presets** (`theme/previews/presets.js`): id → `component` (lazy import of the real `.vue`),
  `props(show)` (objects picked by id from the demo show; the ids are listed at the top of the
  file), `width`/`height` (the stage, Studio's size), `componentWidth`/`componentHeight` (when
  the component differs from the stage: a row-filling widget, a demo needing room for its
  popup), `fit`, `clock` (runs Studio's clock while active), `view(view, show)` (sets up the
  preview's own view state before it mounts: `view.openGroup(0)`, `view.openChase(0, 0)`), `stage`
  (drives the rig: the floating visualizer comes next to it and highlights that preview's
  selection), `start(show)` (e.g. a cue already playing), `props.onX` (handlers for events the component's
  parent panel would handle: the fixture pool only asks to delete), `popupInBox` (a stage
  preset whose component is a popup: it opens in the component's own box, via `StageWrap`'s own
  `popupHost`), `demo`, `webgl`. No video
  fallbacks. To add one: add the entry, use it on its page, add it to the coverage map, run
  `npm run docs:manual:check`. Never
  offer anything interactive that saves or connects (connections widget/popup); the toolbar only
  as a demo.
- **One preview runs at a time** (`LivePreview.vue` coordinator): the one most in view (at least
  half visible, nearest the centre, the running one kept unless another is clearly better; a
  clicked one is pinned). The others are unmounted (WebGL released) and show their title, dimmed,
  with "paused · scroll here or click". Previews never mount a visualizer of their own.
- **Demos** (`theme/previews/demo.js`, preset `demo: [steps]`): `move`, `click` (`ctrl`,
  `shift`), `dblclick`, `context`, `type` (`text`), `field` (label → input, replaced, Enter),
  `key` (`global` for window listeners), `wait`, `caption` (a sentence under the stage, in the
  frame's bar); targets are selectors narrowed by `has` (text), `nth` and `x` (a pinned point),
  `anywhere` (look in the whole page: Studio teleports a select's option list to the body),
  innermost match wins. Real DOM events on the real component; a press focuses what it pressed,
  as a browser does (lists select, style and take keys only when focused), unless the reader is
  typing elsewhere; the reader's input is blocked. **A demo runs its flow to the end and shows
  the result** (the fixture gone from the rig, the new cue played, the effect drawing on the
  floor); captions say what happens and why. Each loop reloads the demo show and remounts. A stopped demo never presses again (a
  press after the component is gone lands on the show being reloaded), loads of the demo show
  never overlap (`host.loadShow` waits for the one in flight), and a component that finishes
  mounting after its preview stopped is unmounted at once.
  Scripted keys stop at the preview (Studio components listen on `window`). CSS `:hover` can't
  be triggered. Check each demo reaches its end state, not only that it starts (`docs:manual:check` fails
  on a step that can't run).
- **On stage** (`stage: true`, `StageWrap.vue`): the component at its Studio size; the stage is
  the component's size (a demo with popups gets room for them). Use it for every preview or demo
  that changes the rig (faders, cues, chases, patching, deleting, effects), so the visualizer card
  comes next to it. The component box clips (panels wider than the box show their first columns).
- **Floating visualizer** (`theme/components/FloatingVisualizer.vue`, mounted by the layout on
  every page but home; state in `previews/stage.js`, written by `LivePreview`): one visualizer
  per page, shown when the page has stage previews. Docked small bottom right; while a stage
  preview runs, attached beside it (right margin first, else left, else above/below), following it
  on scroll; draggable by its title (then free until **↺**), resizable from its corner (limits in
  `SIZES`), collapsible to a title pill with "Show the stage" (3D view unmounted); a bottom sheet
  under 768 px. Collapsed and sizes are per-viewer conveniences in `localStorage`. It mounts
  `VisualizerPreview` through `host.mountVisualizer` after `host.loadShow(pathname)`.
- **Illustrations** (global, in `theme/components/`): `<ShowMap />` draws the demo show from its
  showfile (structure, what owns what); `<SceneFade />` animates a scene's fade (Absolute vs
  Relative start, Warm wash → Sunset); `<EffectWave />` animates the four heads on a waveform with
  Waveform / Phase stop / Direction switches; `<CellsBar />` a 12-cell pixel bar (scene per cell,
  effect over cells vs over fixtures), since the demo rig has no cells. Diagrams, not pictures of
  the app: tokens and fonts only, animate only on screen, still for reduced motion.
- **Demo show rules**: the demo show is the home page's rig (see below), so the manual and the
  hero tell one story. Cue and group colours come from Studio's palette (the accent tokens), never
  a custom colour; heads hang pointing down (rotation 180° on X); an effect's pan/tilt range suits
  hung heads (Ballyhoo pan 92–164, tilt 104–152); scenes start **Relative** (cross-fades).
- **Popups** open in an overlay over the preview: `uk-popup` injects `popupHost` (provided by the
  host; Studio itself uses the body). The overlay scales a popup down to fit the frame.
- **Reset** is enabled by a real reader input in a preview of the page, and disabled again after
  a reset. Runtime errors are logged and the component goes on (as Studio's error handler).
- **Host** (`theme/previews/host.js`, client only, loaded when a preview comes within a screen
  height): one Vue app per preview with `main.js`'s setup and its own view state and keyboard (keys
  only while the focus is in the preview); one shared
  `Show` loaded from `public/presets/manual.showfile.json` per page; saving replaced by a no-op
  bookkeeping version; `axios.defaults.baseURL` = site root (the engine fetches page-relative
  URLs); Studio's clock runs only while a visible preview needs it; a visualizer stand-in
  holds the show's preferences when no visualizer preview is mounted. **Reset** unmounts every
  preview on the page, reloads the show, mounts them again.
- **`FixtureControl.vue`** binds the channels, colour, pan/tilt and cells widgets to a fixture,
  copying `universe.modifier.fragment.vue`'s wiring (those widgets only emit events). Keep it in
  step with that fragment. **`VisualizerPreview.vue`** runs the visualizer at High quality,
  renders only on screen, frames the whole stage for the box's aspect (until the reader moves the
  camera), turns auto-focus off (and cancels the focus flight a new `Visualizer` starts), resolves
  relative asset URLs from the site root, and on unmount disposes its fixtures, takes what it
  added out of Studio's shared scene (`SceneManager` is one scene per page: without that, every
  later visualizer draws the earlier ones too) and releases its WebGL context. WebGL support is
  probed once per page, and the probe's context released (browsers keep 16).
- **Fallback**: no Workers, no WebGL (`webgl`/`stage` presets), or an error → a short message.
  Never a picture or a recording of the app, including while loading (title + empty widget).
- **Unknown ids**: an error box in dev; `docs:manual:build` prints `[manual] <page>: unknown live
  preview "<id>"`.
- **Demo show** = the home page's rig (`hero/story.js`): universe 0 "Stage"; four MAC Aura
  (Standard, 14 ch) at x −4.5, −1.5, 1.5, 4.5 m, 6 m up; group "Rig" with cues Warm wash (scene),
  Rainbow (effect), Ballyhoo (effect), Sunset (scene) and the 8-bar chase "Story" (2 bars each).
  Rebuild it in Studio (and export) rather than editing the JSON by hand: scene channel `type`
  keys come from the fixture adapter. Every fixture profile it or a demo uses (the patch demo's
  `gdtf/generic-par-rgbw.gdtf`), plus `fixtures/fixture_list.json`, must be in
  `APP_STATIC_FILES`.
- **Check**: `npm run docs:manual:check` (`scripts/manual/check-previews.mjs`) starts the manual,
  runs every preview a page uses in headless Chrome (each demo through one loop) and fails on a
  preview that can't start, a `[LivePreview …]` error, a page error, a demo step that can't run,
  a preset no page uses, and a broken `#anchor` link. A full run takes several minutes;
  `-- --page /programming/scenes` checks one page, `-- --url <running manual>` skips the start.
  Chrome comes from `CHROME_PATH` or the usual install path. Required before archiving a change
  that touches a source the coverage map links to a preset. It doesn't see a preview that runs
  but looks wrong: look at the page in `docs:manual:serve` too. Harness behaviour (lazy load,
  sync, Reset, clock) has its dev pages `/_dev/behaviour` and `/_dev/visualizer`.

### Resource links

External Studio URLs are set once, in the repo `.env` (`MANUAL_URL_DEMO`, `MANUAL_URL_WEBSITE`,
`MANUAL_URL_DEV_DOCS`, `MANUAL_URL_DOWNLOAD`). GitHub URLs (repository, releases, discussions,
issues, license) are fixed in `config.js` (`themeConfig.links`, also `this.$links` in
components). In pages, write `<ResourceLink to="demo">live demo</ResourceLink>` and never
hard-code a Studio host. An empty URL hides the nav entry and hero action, renders
`<ResourceLink>` as plain text, and the build prints `manual: unset resource URLs: …`.
Check with `grep -rnE 'asls\.io|timekadel\.com' docs/manual --include=*.md --include=*.vue`.

### Home page

`index.md` places only `<HomeStory/>` (`layout: home`); the app footer follows it. No text gradients, no
outlined pills, no coloured shadows: plain type and Studio's solid round buttons.

- **Story** (`theme/hero/HomeStory.vue`, `stage.js`, `story.js`): a sticky section, one screen
  of scroll per chapter. It opens on a **2D hero only**: the official logo lockup
  (`src/assets/images/studio_logo_textual.svg`), a bold headline, subtitle, solid CTAs and
  "Scroll to discover". Scrolling dissolves it into the scene: the hero blurs, fades and steps
  back slightly while a **liquid reveal** (`theme/hero/reveal.js`, a full-screen WebGL pass of
  domain-warped noise in `--primary-dark`) recedes like ink, centre first, and the camera dollies
  in from its `reveal` framing. The scene isn't rendered before the reveal starts. Then: The stage
  → Patch → Control → Program → Sequence → Output, with numbered copy (01 / 06) alternating left
  and right on a frosted, darkened pool feathered with a radial mask (no box). **Scrolling plays the story like a
  player** (`advance`): inside the story the wheel, swipes and keys don't scroll the page
  (non-passive listeners, `preventDefault`); they play the story forward (down) or back (up) at
  `PLAY_SPEED` (1.6x) the real-time pace of the part it is in (`rateAt`: a chapter's show at its
  `SHOW_SECONDS`, a camera move 0.7 s, the reveal 1.2 s, the last show across its whole chapter).
  The speed eases in over `RAMP.in` (0.45 s) when input starts and out over `RAMP.out` (0.7 s)
  when it stops, along a smoothstep, and passes through zero to reverse; the pace itself eases
  across boundaries (0.3 s), so the speed never jumps. An input keeps playing for `HOLD` ms after
  its last event (wheel 260, touch 140, key 500; key repeat keeps it going, a tap plays a moment).
  Momentum (three weakening wheel events in a row) ends the gesture's input, flat tail included;
  a pause or a much stronger event starts a new one. Autoplay is the same player at 1x with the
  input held forward. The page's scroll catches up once, when playback stops (`settle`), so the
  scrollbar and back/forward stay true; a scroll the story didn't make (scrollbar, a link, the
  page under it) is followed with a glide. The rail, Next, the scroll cue and Replay `seek`
  (cubic ease-in-out, 0.9 s + 0.3 s per chapter, at most 2.2 s). Past the final hero or above
  the top the page scrolls as usual. `LENGTHS` only maps the page's scroll to a position.
  Scroll-tick scrubbing (even throttled) and a one-chapter-per-gesture stepper were both tried
  on 2026-11-11 and felt worse; Autoplay looked smoothest, hence the player. Cue changes follow Studio: a scene fades
  in as a relative scene does, from the previous cue's last values (the cue pool's first scene: the
  control chapter's last frame) to its own, with a cubic ease-in-out across its whole duration
  (`playCueFaded`); an effect starts at once with a short `CUE_FADE`
  crossfade (0.6 s of show time; `blendFrames` blends pan/tilt as 16-bit), and a chapter's end state blends into the next
  chapter's opening state during the transition, so the boundary is continuous. The first
  chapter (The stage) moves as soon as it is scrolled: white beams sweep in a wave and pulse on
  the beat. A bold scroll cue sits bottom centre ("Scroll to discover" on the hero, "Scroll"
  after, chevron, click = next chapter), shown while the story isn't playing; Back to top is hidden on the final hero. A thin progress bar in the chapter's
  colour above the chapter number fills as its show plays (`stepProgress`). Clamp the frame step
  to ≥ 0 (rAF timestamps can precede the loop's start). **Autoplay** and **Next** sit under each
  description. Autoplay is one global toggle (`toggleAutoplay`): it plays the shows at real time,
  easing in and out, up to the final hero, then turns off (any wheel, touch or key also stops it). The
  last scene (Output, no CTAs) is all show: from `OUTRO_FROM` (55%) the final hero takes over
  while that show still runs. As the **final hero** (`outro`) takes over, Output's copy fades,
  the liquid cover flows back over the stage and a second hero
  ("Your next show starts here.", Download / Try the live demo / Read the manual, with
  **Replay** → top stacked under them as a text button) sharpens in, the first hero's
  transition in reverse; the rail and scroll cue fade out. Every scene shows its progress bar.
  Scenes never fade from dark: they fade from the rig's current values. No app footer on the
  home page. The toolbar has a **Manual** cell (→ `/introduction/`) before GitHub, the live demo
  and Download.
- The chase timeline measures its width once, directly (`handleWindowResize`), when its
  chapter is first reached: before that the 3D layer hasn't attached its panel.
- **Performance** (profiled 2026-11-06, headless Chrome on Metal with `--disable-frame-rate-limit
  --disable-gpu-vsync`; headless otherwise caps every page at 30 fps): never dispatch a global
  `resize` to make a widget re-measure (it resized the stage and remounted the timeline: 450 ms
  stalls); call the widget's own handler once. Bump `$liveTicker` only while a live widget (cue
  pool, timeline) is on screen. Pixel ratio is the biggest remaining cost (DPR 2 ≈ 7 ms median
  per scrolling frame on an M2, DPR 1 ≈ 4 ms).
  Per frame (re-measured 2026-11-11; `scratchpad`-style checks: CDP `Performance.getMetrics`
  for layouts, and timing `stage.render` itself, since script share means nothing with the frame
  rate uncapped): no layout while scrolling or at rest, ≈ 1 ms of JS per frame. Never measure the
  page in the input or scroll path (`storyTop` is measured on mount, when ready and on resize;
  handlers only read `scrollY`; nothing scrolls while playing) nor after the CSS3D render (`cssWidth`/`cssHeight` kept from
  `resize`); panels of chapters out of reach are `visible = false` (display: none); CSS
  animations use `transform`/`opacity` only and pause while hidden (`--hint-run`). The render
  loop stops itself once settled on the first hero or under the final one.
- **Lifetime**: the stage lives only while the home page is mounted. On unmount it is disposed
  (`stage.dispose()`: fixtures out, what its visualizer added to Studio's shared `SceneManager`
  taken out, WebGL context and CSS3D layer released; `reveal.dispose()` too). A cached stage kept
  its context and rig alive on every manual page, and its rig showed up in the previews'
  visualizers.
- **Pointer tilt**: the stage's camera swings a little around the point it looks at, towards
  the pointer (`stage.setPointer`). The widget panels and their blur are rendered from an
  untilted copy of the camera (`cssCamera`), so they stay still; the 2D copy doesn't move.
- **Rendering quality**: fixed **Guides** level with beam guides on (no volumetric beams, no
  light on surfaces: the look chosen on 2026-11-06, and it runs everywhere), lighting scale 1, at
  the device pixel ratio capped at 2 (1.5 on phones). Studio's
  visualizer in showcase mode renders four MAC Aura heads on a truss (no Show, no Live);
  `story.js` writes the DMX frame per chapter (channel walk-through, colour and pan/tilt, four
  cues, an 8-bar chase, output) and the camera moves between one framing per chapter.
- **Live panels in the 3D scene**: the app's **real** widgets are DOM placed in the scene with
  three's `CSS3DRenderer` (`stage.js` `addPanel`): each is anchored in front of its chapter's
  camera at 1:1 pixel scale (and capped on small screens), tilted a few degrees, drifting gently,
  so the camera passes it in true perspective between chapters. Panels are **display only**
  (`inert`, no pointer events). Inside a panel Studio's surface tokens are redefined as
  translucent (`color-mix`). `backdrop-filter` doesn't work inside CSS 3D transforms, so each
  panel has a flat blur layer (`.story_blur`) that `stage.updateBlurs()` clips every frame to the
  panel's four projected corners; the panels' drift happens in 3D (in `render`) so both agree. They are fed from the show's frame about 20 times
  a second: channels (`modifier.widget.fixture.channels.vue`),
  colour picker and pan/tilt, the cue pool (clicking a cue plays it on the stage) and the chase
  timeline, plus `UniverseView.vue` (56 live DMX values). Mocks give them what they read: channel
  objects `{ type, color, value, active }`, a group `{ color, fixturePool, cuePool }`, cues
  `{ id, name, type, color, state, chaseActive, time, durationMS, cue() }`, a chase pool
  `{ barSubDiv, duration, actualDuration, tickDuration, elapsedPerc, update(), cues }`. The
  pan/tilt widget needs a new object each update (it doesn't watch fields).
- **`$liveTicker`**: widgets that use `live.mixin.js` read the manual's stand-in
  (`theme/hero/ticker.js`), bumped by the story; the engine is never imported.
- Lifecycle as before: dynamic import on mount, one canvas and WebGL context kept across visits,
  paused off screen and in hidden tabs, one still frame for reduced motion, plain backdrop
  without WebGL; portrait screens get a wider lens.
- **Static files it needs** come from the app's `public/` (`APP_STATIC_FILES` in
  `docs/manual/vite.config.js`), served in dev and copied by `buildEnd`; the manual loads the
  repo `.env` (`envDir`).

## Page style (match `programming/scenes.md`, `programming/chases.md`)

- **Task first.** A Programming page answers a job ("make a chase"); the widget reference sits in
  it under `##` headings with the UI's exact labels. Concepts pages define terms once; the rest
  link to them.
- **Grounded.** Check every label, default, range and behaviour in the running app (and the code)
  before writing it. Behaviour that doesn't work isn't described as working: leave it out of the
  steps, add a `> **Note:**` only where readers would otherwise get stuck, and list it in the epic
  backlog and the PR. Known ones (2026-11): Trigger Style **Temporary**, the group dimmer /
  **Isolate** / **Blackout**, **PWM**, **BOUNCELRT/RTL**, **Quantize** 1/8–1/2, patch bay
  Shift+click, Ctrl multi-select in a group's first scene.
- **Units.** Durations in bars, values in DMX 0–255, angles in degrees, addresses counted from 0
  (as Studio's lists show).

- `#` page title = the task or the UI name. `##` per widget or feature, `###` per action
  ("Adding Fixtures", "Deleting Cue").
- Open with 1–2 sentences on what it is and why you'd use it, then show it live:
  `<LivePreview preset="<id>" />`. A flow is a demo preset; a concept an illustration.
- Every feature gets context, not only its controls: what it is for, a worked example on the demo
  rig (**In the demo show:** …, with its real names and numbers), and tips or pitfalls. Say what a
  preview shows before it (which cue, which fixture, what to watch for).
- Settings go in a `| Setting | Description |` table. Shortcuts use `<kbd>`, e.g. <kbd>`Ctrl`</kbd>.
- Use `> **Note:**` for behaviour that surprises users (BPM sync, quantization).
- Link related pages with absolute paths: `[cues](/programming/scenes)`. Never link to a stub.
- Second person, present tense, short sentences, the UI's exact labels in **bold**.
- Link the <ResourceLink to="demo">live demo</ResourceLink> where readers are invited to try
  something in Studio (it hides itself while `MANUAL_URL_DEMO` is unset).

## Steps

1. Find the affected pages and presets in the [coverage map](#coverage-map), then
   `grep -rln "<feature words>" docs/manual --include=*.md` for mentions elsewhere.
2. Edit them, or create a page and register it in `.vitepress/config.js` `sidebar` (and add it
   to the coverage map).
3. `npm run docs:manual:serve` and check rendering, links, and the sidebar entry.
4. `npm run docs:manual:check` when a preset's source changed (coverage map, Presets column).
5. Fill the PR's manual line: pages updated, previews checked, or n/a with the reason.
