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

## Structure

```
docs/manual/
  index.md                       home page (theme/hero/HomeStory.vue, no prose here)
  introduction/                  about (product presentation), overview ("How Studio works"),
                                 installation, license
  getting-started/               first-show (tutorial, blank show → playing chase), interface (tour)
  concepts/                      index (show structure: what owns what), timing (BPM, bars,
                                 quantize, playback)
  programming/<task>.md          one page per task, in build order: patching, groups, scenes,
                                 effects, chases, playback
  interface/toolbar, visualizer  "Rig & output" until unit 4 rewrites them
  interface/{patchbay,grouppool,modifier}, modifiers/*, workflow/*
                                 one-line "This page moved" stubs (old URLs keep working; not in
                                 the sidebar; remove in a later release)
  public/interface/*.webm        the few recordings a preview can't show
  public/presets/manual.showfile.json   the live previews' demo show
  _dev/*.md                      dev-only check pages (previews, behaviour, visualizer), never built
  .vitepress/config.js           sidebar (add every new page here), resource links
  .vitepress/theme/              Studio shell, live previews, home story
```

Sidebar sections, in order: **Getting started**, **Concepts**, **Programming a show**, **Rig &
output** (accent and icon per section and page in `theme/shell/nav.js`). Unit 4 of epic
`manual-overhaul` (`openspec/epics/manual-overhaul.md`) adds the rig, output and reference pages.

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
  real Studio components. A recording stays only where a preview can't show the point.
- **Global components** (`theme/index.js`): every `uk-*`, `<Video src>`, `<StudioFrame>`,
  `<LivePreview preset>`, `<ResourceLink to>`, `<HomeStory>`.

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
  popup), `fit`, `clock` (runs Studio's clock while visible), `route` + `panel` (panels that read
  the route), `warmRoute` (group and chase panels: their route watchers aren't immediate, so the
  router starts on a sibling route), `demo`, `webgl`, `video` (fallback). To add one: add the
  entry, add it to `_dev/previews.md`, check it mounts. Never offer anything interactive that
  saves or connects (connections widget/popup); the toolbar only as a demo.
- **Demos** (`theme/previews/demo.js`, preset `demo: [steps]`): `move`, `click` (`ctrl`,
  `shift`), `dblclick`, `type` (`text`), `key`, `wait`, `caption` (a hint by the cursor); targets
  are selectors narrowed by `has` (text) and `nth`, innermost match wins. Real DOM events on the
  real component; the reader's input is blocked; each loop remounts it. A demo closes what it
  opens and never changes the show for good (close delete popups, point at toolbar entries,
  never run them). Scripted keys stop at the preview (Studio components listen on `window`);
  demos never take focus on click or type. CSS `:hover` can't be triggered. Check each demo
  reaches its key moment (`/_dev/previews`).
- **Popups** open in an overlay over the preview: `uk-popup` injects `popupHost` (provided by the
  host; Studio itself uses the body). The overlay scales a popup down to fit the frame.
- **Reset** is enabled by a real reader input in a preview of the page, and disabled again after
  a reset. Runtime errors are logged and the component goes on (as Studio's error handler).
- **Host** (`theme/previews/host.js`, client only, loaded when a preview comes within a screen
  height): one Vue app per preview with `main.js`'s setup and its own memory router; one shared
  `Show` loaded from `public/presets/manual.showfile.json` per page; saving replaced by a no-op
  bookkeeping version; `axios.defaults.baseURL` = site root (the engine fetches page-relative
  URLs); Studio's clock runs only while a visible preview needs it; a visualizer stand-in
  holds the show's preferences when no visualizer preview is mounted. **Reset** unmounts every
  preview on the page, reloads the show, mounts them again.
- **`FixtureControl.vue`** binds the channels, colour, pan/tilt and cells widgets to a fixture,
  copying `universe.modifier.fragment.vue`'s wiring (those widgets only emit events). Keep it in
  step with that fragment. **`VisualizerPreview.vue`** runs the visualizer at Guides quality,
  renders only on screen, resolves relative asset URLs from the site root and releases its
  WebGL context on unmount.
- **Fallback**: no Workers, no WebGL (`webgl` presets), or an error → the preset's `video`, else
  a short message. Never a picture of the app, including while loading (title + empty widget).
- **Unknown ids**: an error box in dev; `docs:manual:build` prints `[manual] <page>: unknown live
  preview "<id>"`.
- **Demo show**: one universe "Stage"; two MAC Auras, a ColorBand Pix (12 cells), two PARs;
  groups Moving heads / Pixel bar / PARs, each with scenes, an effect and a chase. Rebuild it in
  Studio (and export) rather than editing the JSON by hand: scene channel `type` keys come from
  the fixture adapter. Every fixture profile it uses, plus `fixtures/fixture_list.json`, must be
  in `APP_STATIC_FILES`.
- **Check**: `npx vitepress dev docs/manual` then `/_dev/previews` (every preset),
  `/_dev/behaviour` (lazy load, sync, Reset, clock), `/_dev/visualizer`.

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
  and right on a frosted, darkened pool feathered with a radial mask (no box). **The scroll is the
  show's clock**: each chapter has its own scroll length (`LENGTHS` in vh, reveal first). Its
  first `SHOW_SHARE` (82%) plays its show (`SHOW_SECONDS`, story.js); the rest is a
  scroll-driven transition where the camera travels to the next chapter's framing and copy and
  panels hand over (out in the first half, in during the second). Everything is a function of
  the story position, so it is anchored and reversible. The position **walks towards the scroll at a constant pace**
  (`advance`: shows at 2× real time, transitions ~0.7 s, the reveal ~1.2 s), whatever the
  scroll's velocity, so trackpad flicks don't speed anything up. During a wheel/touch gesture the
  page is held within a quarter chapter of the story (`holdScroll`), so momentum can't pile up
  scroll to chase; without a gesture (scrollbar, End key) a gap over 1.5 chapters glides, as do
  the rail and Back to top. Cue changes follow Studio: a scene fades
  in as a relative scene does, from the previous cue's last values (the cue pool's first scene: the
  control chapter's last frame) to its own, with a cubic ease-in-out across its whole duration
  (`playCueFaded`); an effect starts at once with a short `CUE_FADE`
  crossfade (0.6 s of show time; `blendFrames` blends pan/tilt as 16-bit), and a chapter's end state blends into the next
  chapter's opening state during the transition, so the boundary is continuous. A bold scroll
  cue sits bottom centre ("Scroll to discover" on the hero, "Scroll" after, chevron, click = next
  chapter), shown only when scrolling is idle (900 ms) and the story has caught up; Back to top
  is hidden on the final hero. A thin progress bar in the chapter's colour above the
  chapter number fills as its show plays (`stepProgress`). Clamp the frame step to ≥ 0 (rAF
  timestamps can precede the loop's start). **Autoplay** and **Next** sit under each
  description. Next skips to the next chapter (`next`: `jumpTo` makes the story glide until it arrives; autoplay, if on, carries on
  from there). Autoplay is one global toggle
  (`toggleAutoplay`): it scrolls through the shows at real time, each chapter straight after the
  previous one, up to the final hero, then turns off (any wheel, touch or key also stops it). The
  last scene (Output, 110vh, no CTAs) is all show: it scrubs across its whole chapter, and from
  `OUTRO_FROM` (55%) the final hero takes over while that show still runs, complete when it
  ends; the final hero's own chapter (40vh) is just the landing. As the **final hero**
  (`outro`) takes over, Output's copy fades, the liquid cover flows back over the stage and a
  second hero
  ("Your next show starts here.", Download / Try the live demo / Read the manual, with
  **Replay** → top stacked under them as a text button) sharpens in, the first hero's
  transition in reverse; the rail and scroll cue fade out. Every scene shows its progress bar.
  Scenes never fade from dark: they fade from the rig's current values. No app footer on the
  home page. No scroll snapping (it fights the scrub).
- The chase timeline measures its width once, directly (`handleWindowResize`), when its
  chapter is first reached: before that the 3D layer hasn't attached its panel.
- **Performance** (profiled 2026-11-06, headless Chrome on Metal with `--disable-frame-rate-limit
  --disable-gpu-vsync`; headless otherwise caps every page at 30 fps): never dispatch a global
  `resize` to make a widget re-measure (it resized the stage and remounted the timeline: 450 ms
  stalls); call the widget's own handler once. Bump `$liveTicker` only while a live widget (cue
  pool, timeline) is on screen. Pixel ratio is the biggest remaining cost (DPR 2 ≈ 7 ms median
  per scrolling frame on an M2, DPR 1 ≈ 4 ms).
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
  `<LivePreview preset="<id>" />`. Only when no preview can show it (a flow across several
  panels, the toolbar's menus): `<Video src="/interface/<name>.webm"/>`.
- Settings go in a `| Setting | Description |` table. Shortcuts use `<kbd>`, e.g. <kbd>`Ctrl`</kbd>.
- Use `> **Note:**` for behaviour that surprises users (BPM sync, quantization).
- Link related pages with absolute paths: `[cues](/programming/scenes)`. Never link to a stub.
- Second person, present tense, short sentences, the UI's exact labels in **bold**.
- Media (recordings only, for what previews can't show): name files
  `<area>_<widget>_<action>.<ext>` in `public/interface/`. If you can't capture media, put
  `<!-- TODO media: <what to record> -->` in its place and list it in the PR. Delete media no
  page references any more.

## Steps

1. Find the affected pages: `grep -rln "<feature words>" docs/manual --include=*.md`.
2. Edit them, or create a page and register it in `.vitepress/config.js` `sidebar`.
3. `npm run docs:manual:serve` and check rendering, links, and the sidebar entry.
4. Mention it in the PR's "Manual" section.
