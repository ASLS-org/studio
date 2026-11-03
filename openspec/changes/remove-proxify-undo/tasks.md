# Tasks

## 1. Baseline

- [x] 1.1 With `npm start`, load the demo show, start one effect on all its fixtures plus one
      looping chase, and record 10 s in the Chrome Performance panel. Save the trace and note
      main-thread time per frame and the top self-time functions. Verify: `queueUndoable` appears
      among them.

## 2. Engine: remove Proxify (models)

- [x] 2.1 In `fixture.model.js`, `fixture.pool.model.js`, `cue.model.js`, `scene.model.js`,
      `cue.pool.model.js`, `effect.model.js` (`FXFixture`, `FXChannel`, `FX`), `fade.model.js`,
      `chase.model.js`, `chase.pool.model.js`, `cue.item.model.js`, `cue.item.pool.model.js`:
      drop `extends Proxify`, `super()` calls that only served it, every `proxify()` call and the
      import; delete all 24 `// TODO: replace with ..AndStackUndo once patched` comments, keeping
      the plain `push` / `splice` they annotate. Verify: `grep -rn "proxify\|Proxify" src` only
      matches `show.model.js`, `router.js` and `proxify.utils.js`, and
      `grep -rn "AndStackUndo" src` only matches `proxify.utils.js`.
- [x] 2.2 In `show.model.js`, remove `static undo()` / `static redo()`, the `changed` listener and
      the import. Add `_savedSnapshot` and `refreshSaveState()` (design.md decision 2), and take the
      snapshot wherever `isSaved` is set to `true` (save, after load, new show). Verify: in the
      console, `$show.refreshSaveState()` after renaming a cue emits `saveState` with `false`, and
      after Ctrl+S with `true`.
- [x] 2.3 Remove the `undo` listener and import from `plugins/router.js`, then delete
      `models/utils/proxify.utils.js`. Verify: `npm start` boots with no import errors and
      `grep -rn "proxify" src` returns nothing.
- [x] 2.4 Smoke-test the engine without Proxify: patch fixtures, create a group, a scene, an
      effect and a chase, play each, save, reload the page. Verify: everything plays, and after
      reload every edit is restored.

## 3. UI: toolbar (views)

- [x] 3.1 Remove the Edit menu from `toolbar.fragment.vue`. Verify: the toolbar shows File, Preferences and
      About menus only, with no console errors.
- [x] 3.2 In the toolbar fragment, call `$show.refreshSaveState()` on window `pointerup`, `keyup`
      and `change`, debounced to 250 ms, and remove the listeners on unmount. Verify, per the
      `showfile` spec scenarios: renaming a cue shows `*`, Ctrl+S clears it; setting a scene
      Dimmer to 255 and back to 0 clears it; playing cues and chases for 60 s on a saved show never
      shows it.

## 4. Visualizer: keep render objects out of reactivity

- [x] 4.1 Wrap the `MovingHead` with `markRaw` in `Fixture.prepare3DModelInstance()`. Verify:
      selecting a patched fixture highlights it in the 3D view and the move/rotate gizmo works.
- [x] 4.2 Assign `markRaw(new Visualizer(...))` in `visualizer.fragment.vue`. Verify: the
      visualizer renders, orbit controls work, and fog/brightness preferences save and reload.
- [x] 4.3 Check that the UI still follows playback. Verify: cue play icons and progress, chase
      playheads (cue container and timeline), the effect wave widget and channel faders in the
      universe view all move while the effect and chase from 1.1 run.

## 5. Docs and AI context

- [x] 5.1 Manual, `docs/manual/interface/toolbar/index.md`: remove the Edit Menu section, change
      "four subsections" to three, add an info box saying Undo and Redo are not available in this
      version, and delete `docs/manual/public/interface/toolbar_nav_edit*.png`. Verify:
      `npm run docs:manual:serve` renders the Toolbar page with no broken images. Note in the PR
      that `toolbar.webm` still shows the old Edit menu and needs re-recording.
- [x] 5.2 Remove undo/Proxify rules and traps from `CLAUDE.md` (rule 2 incl. the
      `pushAndStackUndo` instruction, and the `Show.undo()` trap), `src/models/DMX/CLAUDE.md`,
      skills `dmx-model-change` (incl. the `..AndStackUndo` checklist item), `code-quality`,
      `run-studio`, and invariant 2 in `openspec/config.yaml`; say Undo/Redo is removed until
      `add-undo-redo` and that render objects reachable from `$show` are `markRaw`. Verify:
      `grep -rni "proxify\|undo" CLAUDE.md src/**/CLAUDE.md .claude/skills openspec/config.yaml`
      only matches the new "removed" notes (generated `openspec-*` skills excluded) and
      `grep -rn "AndStackUndo" .` outside `node_modules` returns nothing.

## 6. Integration

- [x] 6.1 Repeat the 1.1 recording with the same show. Verify: `queueUndoable` and the Proxy trap
      are gone from the profile; put before/after frame times in the PR description.
- [ ] 6.2 Run the same playback in the desktop app (`npm run electron:start`). Verify: same
      behaviour as web, no console errors.
      **Deferred by the user (2026-11-03):** Electron was already partly broken before this change;
      check it in a later change.
- [x] 6.3 Run `npx eslint` on all touched files. Verify: it reports no errors.

## Workflow follow-up

- Open the PR against `feat/setup-claude` (exception agreed for this WIP change), not `develop`.
- Archive the change with `/opsx:archive` after review.
