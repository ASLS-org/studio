# Design: add-manual-live-previews

See proposal.md for the why. This design was refined on 2026-11-06, after unit 1 shipped.

## Context

- **App setup.** `src/main.js` builds the app as follows: `createApp(App)`, register every uikit
  component, `$show = reactive(ShowSingleton)`, `$http = axios`, `$utils = reactive(utils)`,
  `$liveTicker = LiveTicker`, then the memory-history router (`src/plugins/router.js`). Widgets
  take model objects as props (`group`, `cue`, `fixture`, …). Modifier fragments read
  `$route.params`. `uk-cue` and `uikit.cue.container.vue` read and push routes.
- **Engine.** `Show` is a module singleton (`src/singletons/show.singleton.js`).
  `Live` (`src/models/DMX/live.model.js`) spawns `@/worker?worker` for its 60 Hz tick.
  `Show.loadFromData()` fetches each fixture profile from
  `${VITE_STATIC_URL}fixtures/<manufacturer>/<model>.json`.
- **Persistence.** The show writes to localStorage only through `Show.persistLocally()`, called
  from the toolbar (`saveLocal`). The visualizer stores its quality setting, except in
  showcase mode.
- **What unit 1 left behind.**
  - VitePress already renders the app's widgets. The home page imports five of them with their
    real CSS, fed by a fake DMX frame through `ManualTicker`, which the theme installs globally
    as `$liveTicker`.
  - `vite.config.js` aliases `@`. It also serves a list of app static files
    (`APP_STATIC_FILES`), copied into the build by `buildEnd`.
  - `<StudioFrame>` draws a widget frame. `asls-scope` replays the app's element rules.
- **Constraint.** VitePress renders pages on the server. Nothing that touches `window`, Workers,
  WebGL or the engine may be imported there.

## Goals / Non-Goals

**Goals:**
- A page author writes `<LivePreview preset="group-cuepool" />` and gets the real component,
  working against a dummy show.
- Reading a page costs nothing until a preview is near the screen, and nothing once it's off
  screen.

**Non-Goals:**
- Previews that span several panels (drag from the patch bay into the group pool). Those stay
  on video.
- A test harness that mounts every preset in CI (unit 5 decides).

## Decisions

### D1. Each preview is its own small Vue app
`<LivePreview>` renders a placeholder inside `<StudioFrame>`. On the client, when the
placeholder comes within one screen height (IntersectionObserver), it dynamically imports
`previews/host.js`. The host runs `createApp(PresetRoot)` with the same setup as `main.js`:
uikit, `$show`, `$http`, `$utils`, the app's real `LiveTicker`, and its own memory router
started at the preset's route. It mounts into the placeholder and unmounts when the page is
left.
*Alternative:* installing the globals in VitePress's `enhanceApp`. That pulls the engine into the
server build, needs a fake router, and clashes with the home page's `ManualTicker`. A child app
gets the app's real environment with no shims.

### D2. One dummy show per page, shared by its previews
The `Show` singleton is shared, so every preview on a page reads the same show. That matches the
app: two panels on the same group stay in sync. The host calls
`Show.loadFromData(manual showfile)` once per page visit. **Reset** reloads it, which restores
every preview on the page. Changing page also reloads it, so a page always starts from the
preset state.

### D3. Preset registry
`previews/presets.js` maps an id to:
- `component`: a lazy import of the real `.vue`;
- `props(show)`: the objects the component gets, selected by id from the dummy show;
- `warmRoute` (optional): see D10;
- `route` (optional, for fragments and widgets that read `$route`);
- `height` and `caption`;
- `clock`: `'on'` when the component shows anything moving;
- `video` (optional): the page's existing video, used as the fallback.

An unknown id renders a visible error box in dev. `docs:manual:build` logs it as a warning.

First set, settled by the spike task (2.1):
- **Widgets:**
  - fixture channels, colour picker, pan/tilt, cells, curve, fixture pool;
  - group settings, cue pool, cue settings;
  - scene fixtures, scene fade curve;
  - effect channels, effect wave;
  - chase timeline;
  - universe settings, fixture settings, fixture position tool.
- **Panels:** patch bay, group pool, the universe/group/scene/effect/chase modifiers, and the
  visualizer.

Out of the set:
- the connections widget and popup (they open a hardware connection);
- the toolbar (its menus save, open files and connect). The manual's own top bar is already
  Studio's toolbar.

### D4. Clock and per-tick cost
`Live` starts only while at least one visible preview has `clock: 'on'`. It stops when none is
visible and when the page changes. The cost while a preview is visible matches the app on the
same show:
- Live's worker tick (60 Hz);
- the engine update for a handful of fixtures;
- `LiveTicker` at 25 Hz for the widgets.

The dummy show is small (one universe, under 10 fixtures), so the engine update stays well under
a millisecond. Off screen and in hidden tabs, nothing runs.

### D5. No persistence, no output
- The host never mounts `app.activity.vue`, so there's no localStorage load or demo bootstrap.
- It never calls `persistLocally` (the toolbar is not a preset).
- The visualizer preset gets its quality through `options.quality` and has no quality popup.
  The visualizer stores quality only when that popup changes it, so the preset never stores it.
- No preset opens a WSC connection (D3 excludes the components that do).
- The manual is served from its own origin. Even if something slipped through, it couldn't reach
  the reader's Studio data.

### D6. Fallback: video or message, never a screenshot
Before a preview loads, its frame shows the component's header and an empty body. No image of
the app appears, which keeps unit 1's rule. When a preview can't run, the frame plays the
preset's `video` if it has one, or else shows a short Studio-styled message ("This preview needs
WebGL"). Causes are an import or mount error (logged to the console) or missing WebGL or Workers.
The rest of the page is unaffected.

### D7. Manual showfile and static files
- **Location:** `docs/manual/public/presets/manual.showfile.json` is an ordinary showfile,
  written in Studio and exported.
- **Contents:**
  - one universe;
  - a moving head (the MAC Aura, already served), an RGB bar with cells, and two PARs. The bar
    and the PARs are picked from the OFL library (`public/fixtures`) when the showfile is
    written;
  - three groups, each with scenes, an effect and a chase.
- **Static files:** the profiles it uses are added to `APP_STATIC_FILES`, so dev serves them and
  the build copies them.
- **Format:** the showfile goes through the normal load path, so a future format change either
  loads it (older-file compatibility) or fails visibly in every preview.

### D8. Visualizer preset
- One `visualizer` preset, on the visualizer page only. It replaces that page's rotate, translate
  and discrete-control videos.
- It runs Studio's visualizer in its normal mode (orbit controls on, its own render loop), with
  Guides quality passed in `options.quality`.
- It pauses off screen like the other previews.
- Without WebGL it falls back to the `visualizer.webm` video (D6).

### D9. Pages
- The seven pages that embed videos swap each one for a preset wherever one exists.
- Multi-panel flows keep `<Video>`, for example dragging fixtures from the patch bay into a
  group.
- Media files that no page references any more are deleted.
- This unit doesn't rewrite the text; units 3–4 do.

### D10. Spike results (task 2.1, 2026-11-06)
Every candidate from D3 mounts and works: 23 presets, with no excluded component and no change to
app code. What the manual needed to make that true:
- **`FixtureControl`** (`previews/FixtureControl.vue`). The channels, colour, pan/tilt and cells
  widgets only emit events; the universe panel writes them to the fixture. The binding is a copy
  of that panel's wiring (LiveMixin values in, `setQuickAccessor` / `setColor` / `setPanTilt`
  out), so these four previews change the show as Studio does. It must stay in step with
  `universe.modifier.fragment.vue`.
- **`warmRoute`**. The group and chase panels read their route only when it changes (their
  watchers aren't immediate). This Studio bug also blanks the group panel when the app jumps
  straight to a group. The host starts those panels on a sibling route and then moves to the
  real one.
- **A visualizer stand-in.** `Show.loadFromData()` writes the show's visualizer preferences to
  `show.visualizerHandle`, which Studio's visualizer panel normally sets. Until a visualizer
  preview mounts the real one, the host gives the show a stand-in that keeps those preferences.
- **Requests from the site root.** The engine fetches `${VITE_STATIC_URL}fixtures/…` relative to
  the page (Studio always runs at its root), so the host sets `axios.defaults.baseURL` to the
  site root.
- **No save.** `loadFromData` ends with `persistLocally()`. The host replaces it on the singleton
  with the same bookkeeping minus the localStorage write.
- **Prose scoping.** `prose.css` styled every heading and paragraph inside the page body,
  previews included. Its element rules now skip `.vp-raw` blocks, and `.asls-scope` resets the
  inherited font size to Studio's 16px.
- **Fixed heights.** Studio widgets fill their container, as in the app's panels, so every preset
  sets a frame height.

Noted, not fixed here: `CuePool.genCueId()` reduces over `this.chases`, which doesn't exist on a
cue pool. It throws whenever a cue is added without an id. The UI always passes one, so only
scripts hit it.

### D11. Revision after review (2026-11-06)
- **Studio's proportions.** Widgets fill their container in Studio's modifier strip (flex row,
  own width, the strip's height), so a preview mounts the component in a flex box at the strip's
  height (239px in a 1440×900 window) and its own width; panels (patch bay, group pool) at their
  measured size. Sizes in `presets.js` were measured in Studio with the demo show. The stage is
  scaled down whole to fit the column (`fit: 'scale'`); modifier panels scroll (`fit:
  'scroll'`). Around it: Studio's idle stripes, now the token `--idle-stripes` in `tokens.css`,
  used by the app's four idle surfaces (empty lists, modifier strip, group pool).
- **Popups.** `uk-popup` appended itself to `document.body` and blurred `#app` (the whole
  manual). It now injects an optional `popupHost` (default: the body, so Studio is unchanged);
  the host provides an overlay over each preview, transformed so fixed backdrops stay in it, and
  scaled down when a popup is larger than the frame.
- **Reset** is available only after a real (trusted) reader input in a preview of the page, and
  unavailable again after a reset.
- **Demos** (`previews/demo.js`, preset `demo`): a cursor plays steps (move, click with
  Ctrl/Shift, double click, type, key, wait, caption) on the real component with real DOM
  events; a blocker stops the reader's input. Each loop remounts the component (selection,
  filters and popups never pile up); demos close their popups and never act on the show for good
  (delete popups are closed, toolbar entries are pointed at, never run). Scripted keys stop at
  the preview (Studio components also listen on `window`: the chase timeline deletes on
  Delete); demos never focus on click or type, and focus a target for a key only when the page's
  focus is free. Synthetic `mouseover` can't trigger CSS `:hover`, so menu entries don't light up.
- **Runtime errors** in a preview are logged and the component goes on, as Studio's own error
  handler does; only a load or mount failure falls back.
- **Media**: patch bay selection/filter/delete, patching, group pool new group and chase play,
  cue pool add, effect channel add, and the toolbar's menus became demos; their screenshots and
  recordings were deleted. Kept: the three visualizer gizmo recordings (fixtures are selected in
  another panel) and `visualizer.webm` (the visualizer preview's fallback).
- Noted, not fixed here (Studio bugs): Shift+click range selection in the patch bay selects
  nothing; opening a scene of a group whose fixtures aren't the show's first throws in the scene
  panel (`selectionKey`); the patch bay's **New** button does nothing (`displayPatchPopup` is a
  stub).

## Risks / Trade-offs

- **A widget assumes the app shell** (popups mounted at the app root, absolute `$router` paths).
  → Task 2.1 mounts every candidate first and records which need a minimal fix in the widget and
  which stay on video.
- **Engine changes break presets silently.** → The showfile uses the normal load path, and prop
  changes show up as the visible error box. Unit 5 decides on a check script.
- **Manual bundle size.** → The engine, uikit and visualizer chunks load only when a preview is
  near the screen. Text pages without previews load none of it.
- **Two engines on the home page?** → The home page keeps its own fake-frame story and has no
  `<LivePreview>`, so the engine never loads there.
