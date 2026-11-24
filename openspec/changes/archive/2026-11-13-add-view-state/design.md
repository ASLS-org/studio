# Design

## Context

What's in view today (see proposal.md, Why):

- `modifier.fragment.vue` mounts the universe, group and chase modifiers all the time. It shows
  one of them with `v-show`, by matching `$route.name`. The route components declared in
  `plugins/router.js` are never rendered: there is no `<router-view>`.
- Each modifier watches its own route param and copies the models into `data`. The group and
  chase modifiers start from placeholders (`new Group()`, `new Chase()`).
- The selection is duplicated:

  | State | Held in |
  |---|---|
  | Group | `group-pool.selectedGroup`, the route |
  | Cue | `group.modifier.cue`, `cuepool.selectedCue` |
  | Fixture | `universe.modifier.selectedFixture` and `selectedFixtureIndex`, `fixture.pool.selected`, the route's `fixtureId` query, each list |
  | Scene fixtures | `group.scene.modifier.selectedFixtureValues` |
  | Cells | `selectedCells` in the universe and scene modifiers |

- The 3D highlight is pushed from six view call sites, through `Fixture.highlight()` and
  `highlightSingle()`, which emit `fixture_highlight`.
- Popups are local `v-model` booleans. `uk-popup` adds its own window `keydown` listener for
  Escape and Enter. So do the toolbar, group pool, cue pool, chase modifier and `uk-menu`.
- **Measured:**
  - Panel switches cost 10 to 20 ms of Vue work, plus style and layout.
  - The first group view compiles one more WebGL program (8 to 9): one 130 to 160 ms task,
    inside the visualizer's frame. No other step of a session compiles anything. The steps
    measured: universes, groups, chases, playing every cue, every channel at 255, quality
    changes.

## Goals / Non-Goals

**Goals:**
- A single place to read and change the panel, selection and popups.
- Fallbacks that come from reading the state, not from repair watchers.
- One keyboard path.
- An app-level check that runs in a real browser.

**Non-Goals:**
- Changing what any widget shows or edits.
- Persisting the view state.
- Lazy-mounting the modifiers: the switch cost is acceptable once the placeholders and
  cascades are gone.

## Decisions

### 1. `ViewState`: a plain class, made reactive, holding ids

`src/views/view.state.js` exports a `ViewState` class. `main.js` creates one, wraps it with
`reactive()` and exposes it as `$view`. It also provides it under the key `view`, for components
used outside the app tree. The manual's `previews/host.js` creates a fresh one per preview.

```
ViewState
  panel: 'universe' | 'group' | 'chase'
  universeId, groupId, chaseId
  memory: {
    universes: { [id]: { fixtureIds: [], cells: null } },
    groups:    { [id]: { cueId, fixtureIds: [], cells: null } },
  }
  modals: [ { name, owner } ]          // bottom -> top

  getters (resolve through $show pools; never throw):
    universe, group, cue, chase, fixtures, fixture (primary = first), cells,
    highlight -> { ids, gizmo }
  actions:
    openUniverse(id), openGroup(id), openChase(groupId, chaseId),
    selectCue(id), selectFixtures(ids), selectCells(cells),
    openModal(name), closeModal(name), isOpen(name), topModal,
    reset()   // show loaded: panel = first universe, memory cleared, modals closed
```

- **Ids, not models.** A getter looks the id up in the pool and returns `null` or the fallback
  when it's gone.
  - **Fallbacks:** a missing cue gives the group's first cue; a missing group gives the first
    group; a missing universe gives the first universe; missing fixture ids are filtered out.
  - The pools are reactive, so a delete anywhere updates every reader. No repair watchers or
    event plumbing are needed.
  - Memory entries are pruned lazily, when an action writes to them.
- **Alternatives:**
  - Pinia: a new dependency and a second store style for no capability we need. Devtools
    inspection of a reactive object is enough.
  - The router as the source of truth: rejected in explore. Selection, cells and popups don't
    fit a URL, and memory history has no URL anyway.
- `ViewState` imports no Vue components and no visualizer, so it can be bundled and checked in
  Node (see the esbuild note in CLAUDE.md).

### 2. Modifiers read `$view`, receive models by props

- `modifier.fragment.vue` switches on `$view.panel`, still with `v-show` (cheap and keeps state).
- Each modifier gets its models from `$view` getters (`group`, `cue`, `fixtures`, ...). The
  placeholders and the route watchers go away.
- Children keep their props.
- Lists and widgets bind their selection to `$view`:
  - the fixture pool's `auto-select` comes from `$view.fixtures`;
  - its `select` and `highlight` events call `selectFixtures`;
  - the cue pool marks `$view.cue` and calls `selectCue`;
  - the group pool marks `$view.group` and `$view.chase`.
- In a group, the group's fixture pool and the scene's fixture list share one selection
  (`fixtureIds` of that group). They list the same fixtures, and the scene edits the ones the
  operator is looking at.
- Focus stays per list. `uk-list` already draws a selected row in the focused style only while
  the list has focus (`hasFocus`), and as selected but unfocused otherwise. So the list the
  operator clicked shows the focused style, and the other shows the same rows as selected.
  `uk-list` must take its selection from `auto-select` and highlights from the bound ids,
  without stealing focus when they change from outside.

### 3. Router: the activities only

`plugins/router.js` keeps `/`, the app, and `/visualizer`, with its guard. Every
`$router.push('/universe|group|...')` becomes a `$view` action. `/visualizer` keeps working as
a separate window and doesn't read `$view`.

### 4. Highlight derived in one place

- `$view.highlight` returns `{ ids, gizmo }` for the panel in view. `visualizer.fragment.vue`
  watches it and calls one new `FixtureRenderer.setSelection(ids, gizmo)`. That method:
  - sets `highlighted` on exactly those instances;
  - attaches the gizmo to them, or detaches it;
  - calls `onChange` once.
- `Fixture.highlight()` / `highlightSingle()` and the `fixture_highlight` event are removed.
  The model no longer carries a view concern.
- The cells widget's hover highlight stays a separate, transient channel.
- **Per-tick cost:** none. It runs on selection changes only, and touches at most every
  instance once.

### 5. Popups by name, one stack

- A popup's open state is `$view.isOpen(name)`. Templates bind it with a small
  `modal(name, owner)` helper from `views/mixins/modal.mixin.js`, which returns a computed
  `v-model` (get: `isOpen`; set: `openModal` / `closeModal`).
- The 17 booleans become names: `universe.patch`, `group.patch`, `cuepool.add`,
  `cuepool.delete`, `toolbar.saveas`, `app.error`, and so on.
- `owner` is a panel, or `app`. Opening another panel closes the modals it owns. `reset()`
  closes them all.
- `uk-popup` drops its window listener. The keyboard router (6) sends Escape and Enter to the
  top modal only.
- `uk-list`'s own delete confirmation is a `uk-popup` inside the list. It registers under a
  generated name, so it stacks like the others.

### 6. One keyboard router

`views/keyboard.js` installs one `keydown` listener on `window` in the capture phase. It handles
a key in this order:

1. **A modal is open:** if the target is inside the top modal, the event goes on to it. Escape
   and Enter call that popup's close and submit. Otherwise the event is stopped. That covers
   "Delete with a popup open".
2. **The target is a text field** (`input`, `textarea`, `contenteditable`): nothing else gets
   the key.
3. **Focused blocks:** components register with the `keys` mixin
   (`registerKeys(el, handler)`). The router calls the handler of the innermost registered
   block that contains `document.activeElement`. `uk-list` keeps its own `keydown` on its body,
   which is already scoped to focus.
4. **Global shortcuts:** the toolbar and `uk-menu` register theirs (`Ctrl+S`, ...).

The window listeners in `toolbar`, `group-pool`, `cuepool`, `chase.modifier`, `uk-popup` and
`uk-menu` are removed.

### 7. Shader warm-up at boot

After the visualizer's first `setPatch`, it makes the objects that are drawn late visible for
one compile:
- the gizmo;
- the multi-selection bounding box (`controls.js`, `MeshBasicMaterial` / `LineBasicMaterial`);
- the highlight materials (`instance_highlight.js`).

Then it runs `renderer.compileAsync(scene, camera)` and hides them again. The program that
compiles late is confirmed during apply by diffing `renderer.info.programs` around the first
group view. The warm-up covers whatever that diff shows. It runs while the splash is still up.

### 8. `npm run app:check`

`scripts/app/check-app.mjs` follows `scripts/manual/check-previews.mjs`:
- a free port, the Vite dev server, puppeteer-core, Chrome from `CHROME_PATH` or the system
  install;
- the demo show, loaded fresh.

Scenarios use real clicks and keys and print PASS/FAIL. The run exits non-zero on any failure.
- Panels:
  - universe, group, chase and back;
  - the strip, the group pool and the patch bay agree;
  - no `longtask` over 50 ms after load.
- Memory: group 0 cue 4 and fixtures 3 and 5, away and back; universe fixture and cells.
- Deletes:
  - the cue, group and fixture in view;
  - the fixture from the patch bay;
  - the fallback is shown, with no `app_error`.
- Highlight: the renderer's highlighted ids match the selection after every step.
- Shared selection: clicking in the scene's fixture list selects the same row in the group's fixture pool. Only the clicked list has focused-style rows, and the other shows them as selected but unfocused.
- Keys:
  - Delete in a focused list only;
  - Delete with a popup open does nothing;
  - Escape closes the top popup only;
  - Ctrl+S saves from any panel;
  - typing in a field doesn't trigger shortcuts.
- Popups: switching panel closes that panel's popups; an error over the universe patch popup
  is closed alone by Escape.

The scenarios are written first and run against today's code, where several fail. They are the
acceptance test of this change, and of later units of the epic.

## Risks / Trade-offs

- **Every modifier and popup is touched.** The change is large.
  → `app:check` and `docs:manual:check` are run after each task group, not only at the end.
- **Manual previews mount widgets alone, without the app's `$view`.**
  → Each preview gets a fresh `ViewState`. Presets that preselected through route queries
  call `$view` actions instead.
- **Capture-phase key handling can swallow keys a widget needs** (sliders, the timeline's
  arrows).
  → Only an open modal stops events. Otherwise the router passes events through and decides
  only who handles shortcuts. Widgets keep their element-level listeners.
- **A shared fixture selection between the group pool and the scene list changes behaviour
  slightly**: selecting in one selects in the other.
  → They show the same fixtures, and the user confirmed this is what they expect. The focused
  list shows the focused style and the other shows the same rows as selected but unfocused.
  Called out in the manual.
- **`compileAsync` support:** it is available in three r170. Where `KHR_parallel_shader_compile`
  is missing, it compiles synchronously, at boot, behind the splash.
- **The 50 ms threshold is measured with WebGL on the CPU** (SwiftShader in headless Chrome).
  Real GPUs are faster, so this is conservative.
