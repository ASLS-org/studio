# Design (draft): add-manual-live-previews

Draft written with the epic plan on 2026-11-05. Refine in the unit branch before writing the specs
and tasks.

## Context

- Widgets take model objects as props (`group.modifier.widget.cuepool.vue` takes `group`, …) and
  use the app globals `$show`, `$utils`, `$liveTicker` and `LiveMixin`. Modifier fragments read
  `$route.params` from the memory-history router in `src/plugins/router.js`. `uk-cue` reads
  `$route.params.chaseId`, and `uikit.cue.container.vue` calls `$router.push`.
- `src/main.js` is the full app setup: uikit registration, `reactive(ShowSingleton)`, `$utils`,
  `$liveTicker`, router.
- The `Show` is a module singleton (`src/singletons/show.singleton.js`). `Live` spawns
  `@/worker?worker`, which Vite (and therefore VitePress) can bundle.
- VitePress renders pages on the server at build time, so nothing that touches `window`,
  `document`, Workers or WebGL may load there.

## Decisions (draft)

### D1. Each preview is its own small Vue app
`<LivePreview>` renders a host `<div>` inside `<StudioFrame>`. On the client, once visible
(IntersectionObserver), it dynamically imports `previews/host.js`. That module runs
`createApp(PresetRoot)` with the same setup as `main.js`: uikit, `$show`, `$utils`,
`$liveTicker` and its **own** memory router holding the preset's route. It mounts the app into
the div and unmounts it on page leave.
*Why not install the globals in VitePress's `enhanceApp`?* That would pull the engine into the
server-side build, and VitePress's app has no vue-router. A child app per preview gives the app's
own environment with no shims.

### D2. One dummy show per page, shared by its previews
The `Show` singleton is shared, so all previews on a page read the same show. The host loads
`/presets/manual.showfile.json` once per page visit (`Show.loadFromData`). **Reset** reloads it.
Presets select the objects they need by id. Two previews of the same group stay in sync, which
is accurate to the app.

### D3. Preset registry
`previews/presets.js`: `{ id: { component: () => import(...real .vue...), props: (show) => ({…}),
route?: '/group/1/cue/2', height, caption, clock: 'off' | 'on', poster } }`. Authors write
`<LivePreview preset="group-cuepool" />`. An unknown id is a visible error box in dev and a
build warning.

### D4. Clock and cost
The Live clock starts only when a visible preview has `clock: 'on'`. It stops when none are
visible and on route change. That matters because Live's 60 Hz tick and `$liveTicker` at 25 Hz
would otherwise run while the reader reads text. There's at most one visualizer preset per page,
at the lowest render resolution.

### D5. No persistence, no output
The host never mounts `app.activity.vue` (which owns localStorage save/load and the demo
bootstrap), and never opens WSC connections. Widgets that would open the connections popup
are not offered as presets.

### D6. Fallback
`poster` (a still image) is shown before the preview loads, when it fails (with the error logged
to the console) and when WebGL or Workers are missing. Videos stay available through `<Video>`.

## Risks / Trade-offs

- [A widget assumes the app shell (popups mounted at app root, `$router` paths)] → the first
  task mounts each candidate widget in a spike page and lists the ones that need a minimal fix or
  have to stay on video.
- [Engine changes break presets silently] → the manual showfile goes through the normal load path,
  so it gets older-file compatibility for free. Prop changes surface as the visible error box.
  Unit 5 decides on a local `docs:manual:check-previews` script.
- [Bundle size of the manual] → engine, uikit and visualizer chunks load only when a preview
  is visible.

## Open Questions

- Whether the visualizer preview is worth its weight on a docs page, or whether a looped short
  video is enough there. Decide after the spike.
