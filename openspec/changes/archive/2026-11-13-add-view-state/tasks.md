# Tasks

## 1. Acceptance check first (tooling)

- [x] 1.1 Add `scripts/app/check-app.mjs` and `npm run app:check`, built on `scripts/manual/check-previews.mjs`. It picks a free port, starts the Vite dev server, finds Chrome through `CHROME_PATH` or the system install, and loads the demo show fresh. It prints PASS/FAIL per scenario and exits non-zero on any failure. Verify: `npm run app:check` runs to the end and prints a report.
- [x] 1.2 Write the scenarios from design §8 (panels and long tasks, memory, deletes, highlight, keys, popups) with real clicks and keys. Verify: run against today's code. The failures match the problems in the proposal (no memory, a Delete reaching a list behind a popup, the long task on the first group view, the highlight after a switch). Record the failing list in the PR.

## 2. View state (UI)

- [x] 2.1 `src/views/view.state.js`: `ViewState` with `panel`, ids, per-group and per-universe memory, the modal stack, getters that resolve through the pools with fallbacks, the actions and `reset()`. JSDoc everything. Verify: bundle it with esbuild (CLAUDE.md, Known traps) and run a Node script against a demo show: getters fall back after deleting a cue, a group and a fixture, memory is restored, and `reset()` clears everything.
- [x] 2.2 Expose it in `main.js` (`$view`, plus `provide('view')`), call `reset()` on show load (`show_loaded`), and create a fresh instance per preview in the manual's `previews/host.js`. Verify: `npm start`, `$view` is reachable from the console, and loading another show resets it.

## 3. Panels and selection (UI)

- [x] 3.1 Router: keep only `/` and `/visualizer`. Replace every panel `$router.push` and `$route` read in the views with `$view` actions and getters. Verify: `grep -rn "\$route\|\$router" src/views` finds only the visualizer window paths. (Note: nothing opens `/visualizer`. `App.vue` mounts the app directly and no `<router-view>` exists, so the route stays only for a future separate window.)
- [x] 3.2 `modifier.fragment.vue` switches on `$view.panel`. The universe, group and chase modifiers read their models from `$view`. Remove the placeholders (`new Group()`, `new Chase()`) and the route watchers. Verify in the app: open universes, groups and a chase from the patch bay and the group pool; the right panel shows each time with no app error.
- [x] 3.3 Bind the selections to `$view`:
  - group pool: selected group and chase;
  - patch bay: the universe in view;
  - cue pool: `selectedCue` goes;
  - fixture pool widget: `selected`, `auto-select`, `select` and `highlight`;
  - universe modifier: `selectedFixture`, the index and the cells;
  - scene fixtures widget: shares the group's `fixtureIds`;
  - scene modifier: cells.

  Verify in the app:
  - in group 0, pick cue 4 and fixtures 3 and 5, open group 1, then group 0: both are back;
  - do the same for a universe's fixture and cells;
  - clicking fixture 5 in the scene's fixture list selects it in the group's fixture pool too, with the scene's list in the focused style and the pool selected but unfocused;
  - clicking in the pool swaps the two styles;
  - a selection change from the other list never moves focus.
- [x] 3.4 Deletes fall back through the getters: remove the repair watchers (for example the fixture-count watcher in the universe modifier, and `deleteGroup`'s route push). Verify in the app: delete the cue, the group and the fixture in view, and a fixture from the patch bay. The fallback shows and no error popup opens.

## 4. Highlight (visualizer)

- [x] 4.1 Add `FixtureRenderer.setSelection(ids, gizmo)`. `visualizer.fragment.vue` watches `$view.highlight` and calls it. Remove `Fixture.highlight()` / `highlightSingle()`, the `fixture_highlight` event and the six view call sites. The cells hover highlight stays. Verify in the app: select two fixtures in a universe, then open a group whose memory holds two others. Only those two are highlighted, with the gizmo on them, and after deleting one only the other stays.
- [x] 4.2 Shader warm-up: diff `renderer.info.programs` around the first group view to name the late program. Then make the gizmo, the selection box and the highlight materials visible for one `renderer.compileAsync(scene, camera)` after the first `setPatch`, behind the splash. Verify: the program count no longer grows on the first group view, and `app:check` reports no long task over 50 ms there.

## 5. Popups and keys (UI)

- [x] 5.1 Add `views/mixins/modal.mixin.js` (`modal(name, owner)`, giving a computed `v-model`). Move the 17 popup booleans to named modals with an owner panel. `uk-popup` drops its window listener and registers its close and submit with the stack. Panel switches close that panel's modals. Verify in the app:
  - with the universe patch popup open, an error popup opens on top and Escape closes only the error popup;
  - switching panel closes the universe patch popup.
- [x] 5.2 Add `views/keyboard.js`: one capture-phase listener that goes to the top modal, then text fields, then focused blocks (`keys` mixin), then global shortcuts. Move the toolbar, group pool, cue pool, chase modifier and `uk-menu` handlers onto it. Verify in the app:
  - Delete with a popup open does nothing;
  - Delete in the focused fixture pool doesn't reach the group pool;
  - Ctrl+S saves from every panel;
  - typing a name in a field triggers no shortcut.

## 6. Acceptance

- [x] 6.1 `npm run app:check`: every scenario passes. Repeat the switch scenarios with two cues playing. Verify: the report shows ALL PASS and no long task over 50 ms after load.
- [x] 6.2 `npm run docs:manual:check` passes. Every preset mounts widgets that now read `$view`, so fix the presets that used route queries. Verify: the check is all clear.

## 7. Docs and AI context

- [x] 7.1 Update the manual:
  - `getting-started/interface` (the modifier strip, selection remembered per group and universe);
  - `reference/shortcuts` (popups stack, Escape closes the top one, which block gets a key);
  - `programming/groups` (the group pool and scene list share a selection);
  - `programming/patching` (selection remembered).

  Verify in `npm run docs:manual:serve`, then run `npm run docs:manual:check`.
- [x] 7.2 Update the AI context:
  - `src/views/CLAUDE.md`: `$view` is the source of truth, popups go through named modals, keys go through `keyboard.js`, and "Navigation" no longer means `$router.push`;
  - `src/plugins/visualizer/CLAUDE.md`: `setSelection` replaces `fixture_highlight`, plus the warm-up;
  - root `CLAUDE.md`: the `app:check` command and the eventbus line;
  - skills `vue-ui-change` (selection, popups, keys) and `run-studio` (`app:check`);
  - the epic doc's units table: it lives on `epic/ui-ux-stabilization` only (this branch stacks on unit 1), so it is updated there when this unit's PR is opened.

  Verify: `grep -rn "fixture_highlight\|\$router.push" CLAUDE.md src/**/CLAUDE.md .claude/skills` returns nothing stale.
- [x] 7.3 `npx eslint` on all touched files is clean.
