# ASLS Studio

Open-source DMX lighting control + real-time 3D visualizer. Vue 3 SPA that runs in the browser
or packaged as an Electron desktop app. Show output goes to hardware over the WSC protocol.
GPL-3.0. Plain JavaScript (no TypeScript), no test suite.

## Commands

| Task | Command |
|---|---|
| Dev server (web, :5173) | `npm start` |
| Desktop dev | `npm run electron:start` |
| Lint check (no writes) | `npm run lint:check`, or `npx eslint <files>` for touched files |
| Lint autofix | `npm run lint` (runs `--fix` over all of `src/`: only when asked) |
| Web build | `npm run build` → `dist/` |
| Embed build | `npm run build:embed` |
| Desktop dist | `npm run dist:mac` / `dist:linux` / `dist:win` |
| User manual | `npm run docs:manual:serve` (VitePress, `docs/manual`) |
| Manual preview check | `npm run docs:manual:check` (headless Chrome: previews, demos, anchors) |
| App flow check | `npm run app:check` (headless Chrome: panels, selection memory, deletes, highlight, keys, popups, main-thread blocks) |
| Spec workflow | `openspec list`, `openspec validate --all` |

Node 18 (`.nvmrc`). Path aliases: `@` → `src/`, `@root` → repo root.

## Architecture map

```
src/
  main.js                 app bootstrap: registers uikit globally, $show/$utils/$http globals
  singletons/show.singleton.js   the one Show instance (exposed as this.$show)
  models/DMX/             show engine (pure-ish JS classes)  → see models/DMX/CLAUDE.md
  models/fixtures/        fixture profiles: library loader, OFL + GDTF adapters, GDTF store (IndexedDB)
  views/view.state.js     $view: what's in view, selected and open (ids, per-context memory)
  views/keyboard.js       $keyboard: the one key path (top popup → focused block → shortcuts)
  plugins/router.js       memory router: activities only (`/`, `/visualizer`), no panel routes
  plugins/eventbus.js     mitt bus (app_error, app_ready, visualizer_*)
  plugins/wsc.connection.js  WSC output (connections + per-universe streams) → skill wsc-output
  plugins/visualizer/     Three.js r170 renderer → see plugins/visualizer/CLAUDE.md
  views/                  Vue components (Options API) → see views/CLAUDE.md
  electron/               desktop shell; spawns the bundled WSC gateway → see electron/CLAUDE.md
  worker.js               60 Hz tick Web Worker that drives Live
public/fixtures/          Open Fixture Library (OFL) JSON + fixture_list.json index
public/gdtf/              generic CC0 GDTF bundle, written by scripts/gdtf/generate-generic.mjs
public/demo/showfiles/    demo + blank showfiles (loaded on first run)
docs/manual/              end-user manual (VitePress) → skill user-manual
docs/developer/           JSDoc via docma (models only); Storybook config is stale and not installed
openspec/                 specs + change proposals (spec-driven workflow)
```

Data flow: `Show` → pools (`universePool`, `fixturePool`, `groupPool`, `outputPool`) → `Group` →
`cuePool` (Scene/Effect cues) + `chasePool`. `Live` (singleton clock) calls every registered
animation each tick; cues write fixture channels; `Universe` packs channels into a 512-byte DMX
buffer; a `WscConnectionStream` sends the buffer to the gateway every tick.

## Rules that break things when ignored

1. **Save/load round-trip.** Persistent state is serialized through `get showData()` on each model
   and rebuilt in `Show.loadFromData()` → `prepare*()` / pool `addRaw()`. A new persistent field
   needs both sides and a default for older showfiles that don't have it.
2. **Save state and reactivity.** There is no undo/redo (removed until change `add-undo-redo`).
   The toolbar's unsaved `*` comes from `Show.refreshSaveState()`, which compares `showData` with
   the last save, so playback state must never be part of `showData`. Render objects reachable
   from `$show` (3D instances, the visualizer) are created with `markRaw`.
3. **Live animations.** Anything that runs over time registers with `Live.add(fn, quantize, fps)`
   and must `Live.remove(id)` on stop/delete. Durations are in bars (`Live.barDuration`), not ms.
4. **Pools.** `getFromId` throws when the id is missing, so wrap it when absence is legal.
   Use `addRaw(data)` to construct, `addExisting(instance)` to share, `clearAll()` to reset.
5. **Real-time budget.** Engine updates and the visualizer share the main thread at 60 fps. No
   allocations, Vue reactivity, or logging inside per-tick code.

## Conventions

- Style: airbnb-base + `plugin:vue/vue3-recommended`, 2 spaces, 100-col max, single quotes.
  Details in skill `code-quality`.
- JSDoc every class, public method, and getter/setter (`@public`, `@param`, `@type`). Docma builds
  the core docs from `src/models/**`.
- Commits: Conventional Commits, path-like scopes. Details in skill `git-collaboration`.
- Branches: every implementation (every `/opsx:apply`) gets its own branch off `develop`, with a PR
  into `develop`. A change the user calls a **hotfix** branches off `master` (PR into `master`, then
  back-merge into `develop`). A change the user calls a **quickwin** is committed on `develop`
  directly, with no branch and no PR.
- Epics (complex work made of several changes): `epic/<name>` off `develop` holds the plan
  (`openspec/epics/<name>.md` plus each change's proposal). Each change gets a unit branch off the
  epic branch, where its artifacts are refined, applied and archived, then a PR back into the epic
  branch. The epic branch goes into `develop` when all its changes are archived.
- **Never push to `develop`, `staging` or `master` unless the user explicitly asks, and confirm
  that exact push with them before running it.**

## Workflow

- Non-trivial behaviour changes go through OpenSpec: `/opsx:explore` → `/opsx:propose` →
  `/opsx:apply` → `/opsx:archive`. Trivial fixes (typo, lint, one-line bug) skip it.
- Specs are written only for areas a change touches. Do not back-fill specs.
- Definition of done for any change:
  1. Touched files lint clean.
  2. Verified in the running app (skill `run-studio`).
  3. User manual updated if the change alters how the app is used: the pages and previews the
     touched files map to in skill `user-manual` § Coverage map, and `npm run docs:manual:check`
     passing when a mapped preview's source changed.
  4. AI context updated if the change alters architecture, conventions, or commands
     (skill `ai-context-maintenance`).

## Known traps

- `@asls/wsc-client` is sometimes `npm link`ed to `./wsc-client` (git-ignored). If that folder is
  empty, imports break: run `npm install` to restore the registry package.
- Models don't import the visualizer: they emit `patch_changed` and `fixture_pose` on the
  EventBus, and the visualizer reads universe frames. The selection highlight comes from
  `$view.highlight` (views/view.state.js), never from models.
- Channel `type` keys (`Dimmer`, `Pan`, ...) and their index are stored in showfile scenes. The
  OFL and GDTF adapters in `src/models/fixtures/` must keep deriving them exactly; see skill
  `fixture-library`.
- Node can't import `src/` files directly (ESM without `"type": "module"`, `@` alias). For Node
  checks, bundle with `npx esbuild <entry> --bundle --platform=node --format=esm --alias:@=./src`
  plus a `createRequire` banner (xml2js needs Node built-ins).
- The WSC output path has several known bugs. Read skill `wsc-output` § Known issues first.
- Components set `compatConfig: { MODE: 3 }` (the app runs on `@vue/compat`). Keep it on new ones.
- `.env` is committed and holds public URLs only. Never put secrets in it; use `.env.local`.
- Never edit generated or vendored output: `dist/`, `out/`, `docs/**/dist`, `public/fixtures/*`
  (except via skill `fixture-library`), `public/gdtf/*` (re-run its generator),
  `src/plugins/visualizer/orbitcontrol.zup.patch.js`.
