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
  index.md                       home page, composed of theme/components/home/* (no prose here)
  introduction/                  about (product presentation), overview ("How Studio works"),
                                 installation, license
  interface/<area>/index.md      one page per screen region: toolbar, patchbay, grouppool, visualizer, modifier
  modifiers/<area>/index.md      one page per modifier: universe, group, chase
  workflow/<task>/index.md       task guides: environment, patching, grouping, scenes, effects, triggering
  public/home/*.webp             product screenshots used by the home page and introduction
  public/interface/*.png|webm    screenshots and screen recordings
  .vitepress/config.js           nav, sidebar (add every new page here), resource links
  .vitepress/theme/              look, global components, home sections
```

Gaps known on 2026-11-05: all `workflow/*` pages are "Documentation in progress", and there is
no page for **outputs/connections (WSC)** or the **desktop app**. Epic `manual-overhaul`
(`openspec/epics/manual-overhaul.md`) plans to fill them and restructure the sidebar.

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
  the scope). Unit 2 of epic `manual-overhaul` adds `<LivePreview>` on top of it.
- **No screenshots of the app as product imagery.** Product visuals are live: the 3D hero and
  real Studio components. Existing `<Video>` clips stay until unit 2 replaces them.
- **Global components** (`theme/index.js`): every `uk-*`, `<Video src>`, `<StudioFrame>`,
  `<ResourceLink to>`, `<HomeStory>`.

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

## Page style (match `modifiers/universe/index.md`, `modifiers/chase/index.md`)

- `#` page title = the UI name. `##` per widget or feature, `###` per action ("Adding Fixtures",
  "Deleting Cue").
- Open with 1–2 sentences on what it is and why you'd use it, then show it:
  `<Video src="/interface/<name>.webm"/>` (global component) or
  `<img style="border-radius:5px" src="/interface/<name>.png" alt="..." width="300"/>`.
- Settings go in a `| Setting | Description |` table. Shortcuts use `<kbd>`, e.g. <kbd>`Ctrl`</kbd>.
- Use `> **Note:**` for behaviour that surprises users (BPM sync, quantization).
- Link related pages with absolute paths: `[cues](/modifiers/group/)`.
- Second person, present tense, short sentences, the UI's exact labels in **bold**.
- Media: name files `<area>_<widget>_<action>.<ext>` in `public/interface/`. If you can't capture
  media, put `<!-- TODO media: <what to record> -->` in its place and list it in the PR.

## Steps

1. Find the affected pages: `grep -rln "<feature words>" docs/manual --include=*.md`.
2. Edit them, or create a page and register it in `.vitepress/config.js` `sidebar`.
3. `npm run docs:manual:serve` and check rendering, links, and the sidebar entry.
4. Mention it in the PR's "Manual" section.
