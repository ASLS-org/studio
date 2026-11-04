# Tasks

## 1. Baseline

- [ ] 1.1 On the epic branch build, load the demo show, start a scene, a dimmer effect and a
      looping chase, and record 10 s in the Chrome Performance panel with the universe view open
      on an animated fixture. Note main-thread time per frame and the top self-time functions.
      Verify: the trace is saved and the numbers are written into the PR description draft.
      **Deferred by the user (2026-11-04):** performance recordings come later in the epic.

## 2. Engine: frames and output (models, plugins/wsc)

- [x] 2.1 `Live`: add `onFrame(fn)` / `offFrame(id)`; `update()` runs frame callbacks after the
      animations on every tick, whatever the play state (design.md decision 1). Verify: `npx eslint`
      clean; a callback registered from the console keeps firing while the show is paused.
- [x] 2.2 `Universe`: persistent `frame` (`Uint8Array(512)`) and `packFrame()`; `DMX512Data`
      returns the frame without allocating. `UniversePool` registers one frame callback that packs
      every universe, then forwards running streams (decision 2). Verify: `npx eslint` clean.
- [x] 2.3 `WscConnectionStream`: `start`/`stop` only change state; `forward(frame)` is called by
      the pool. Verify: with a gateway connected (`npm run electron:start` or a local gateway),
      spec "Pause during an effect" and "Edit while stopped" hold; skill `wsc-output` § Verify.
- [x] 2.4 Update skill `wsc-output` (streams are no longer `Live` animations; output runs while
      paused) and `src/models/DMX/CLAUDE.md` (`Live.onFrame`, universe frames). Verify: both
      files describe the frame phase.

## 3. Engine and UI: playback without Vue (models, views)

- [ ] 3.1 Add `src/models/utils/reactivity.js` (`markRaw`, `toRaw`). `Cue.cue()` and `Chase.cue()`
      bind their `Live` callbacks to the raw object; `Fixture.prepareChannels()` marks channels raw
      (decision 3). Verify: `npx eslint` clean; with Vue devtools, running an effect on a fixture
      that is not displayed triggers no component updates.
      **Deferred by the user (2026-11-04):** Vue devtools needs setting up first.
- [x] 3.2 Add the UI ticker (`src/plugins/live.ticker.js`, `$liveTicker` in `main.js`): 25 Hz
      while subscribed, `bump()` for edits (decision 4). Verify: `npx eslint` clean.
- [x] 3.3 Switch the live-value widgets to the ticker: `universe.modifier.fragment.vue` (channel
      faders, pan/tilt, colour picker), `group.modifier.widget.cuepool.vue`, `chase.modifier.widget.timeline.vue`,
      `uikit.cue.container.vue` (including the `group.DMXActivity` watcher), `uikit.cue.vue`, the
      effect wave widget (fixture dots) and both fade curve widgets (play-position dot), through
      `views/mixins/live.mixin.js`; edits call `bump()`. (`group.scene.modifier.fragment.vue` shows
      the scene's stored values, which playback doesn't write: no change needed.) Verify: spec "Watch an effect on the selected fixture", "Cue progress and
      playheads" and "Drag a fader while stopped".
- [x] 3.5 Chase-driven cues: `Cue` gets a runtime `chaseActive` flag (not saved) that `Chase.update()`
      sets while any of the cue's items is inside its window and `Chase.cue(false)` clears;
      `Group.DMXActivity` and the cue pool's play indicator use `state || chaseActive`. `state`
      handling is unchanged (Scene relies on it for relative fades). Bug present on master and
      develop, fixed here as its own commit (decided 2026-11-04). Verify: spec "Chase plays a
      scene".
- [x] 3.4 Update skills `vue-ui-change` (live values come from the ticker) and `dmx-model-change`
      (callbacks run on raw objects; widgets must not rely on reactivity for playback fields), and
      `src/views/CLAUDE.md`. Verify: the three files mention `$liveTicker`.

## 4. Visualizer: decoupling (plugins/visualizer, models)

- [ ] 4.1 `Show.patchSnapshot` and the `patch_changed`, `fixture_pose`, `fixture_highlight`
      events from `FixturePool`, `Universe`, and `Fixture` (decision 6); `highlight*`, `posX..rotZ`,
      `position`/`rotation` keep their signatures. Verify: `npx eslint` clean.
- [ ] 4.2 Add `plugins/visualizer/fixture_renderer.js`: instances from the snapshot (diff by id),
      per-universe last-frame copy, whole-fixture decode on change with the capability switch moved
      out of `Fixture.setChannel` (decision 5). Wire it in `visualizer.fragment.vue` (events
      coalesced per animation frame). Verify: spec "Effect on a dimmer" and "Fader edit while
      paused"; the demo show looks the same as on the epic branch build (side by side).
- [ ] 4.3 `Controls` on renderer instances keyed by id, emitting `fixture_transformed`; the
      fragment applies it to the fixture (decision 7). Verify: spec "Select two fixtures", "Move
      with the gizmo" and "Type a rotation".
- [ ] 4.4 Remove `_3DModel`, `prepare3DModelInstance`, `deleteInstance` 3D handling and the
      `MovingHead`/`Controls` imports from `Fixture`; keep the Moving Head-only patch check in the
      patch path (decision 8). Verify: `grep -rn "plugins/visualizer" src/models` returns nothing;
      patching a non-Moving Head fixture still shows "This fixture type is not supported yet.";
      deleting a fixture removes it from the 3D view.
- [ ] 4.5 Update `src/plugins/visualizer/CLAUDE.md` (renderer, events, no model writes except
      `fixture_transformed`), `src/models/DMX/CLAUDE.md` (remove the coupling debt line) and root
      `CLAUDE.md` § Known traps (models runnable headless). Verify: no file still says `Fixture`
      owns a `MovingHead`.

## 5. Docs and integration

- [ ] 5.1 Manual, `docs/manual/interface/toolbar/index.md` § Inputs/Outputs: output keeps running
      while the show is paused or stopped. Verify: the page compiles on
      `npx vitepress dev docs/manual`.
- [ ] 5.2 Repeat the 1.1 recording. Verify: no Three.js or Vue frames inside the `Live` tick; put
      before/after frame times in the PR description.
      **Deferred with 1.1 (2026-11-04).**
- [ ] 5.3 `npm run build`. Verify: build succeeds.
- [ ] 5.4 Run `npx eslint` on all touched files. Verify: it reports no errors.

## Workflow follow-up

- Two PRs into `epic/gdtf-render-pipeline` from this branch (decided 2026-11-04):
  - PR A after groups 1-3 are verified (engine frames, output, playback without Vue).
  - PR B after PR A is merged and groups 4-5 are verified (visualizer decoupling, docs); archive
    with `/opsx:archive decouple-visualizer-from-models` and set unit 2 to `archived` in
    `openspec/epics/gdtf-render-pipeline.md` before opening it.
