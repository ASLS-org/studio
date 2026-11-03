# Design

## Context

See proposal.md (Why). What the removal touches:

- `models/utils/proxify.utils.js` exports `Proxify` (base class whose `proxify(except)` returns a
  `Proxy` that records every assignment) and `ProxifySingleton` (undo/redo stacks, `changed` /
  `undo` events, window `mousedown`/`mouseup` listeners that batch entries).
- Classes extending `Proxify`: `Fixture`, `FixturePool`, `Cue` (so `Scene`, `FX`), `CuePool`,
  `FXFixture`, `FXChannel`, `Fade`, `Chase`, `ChasePool`, `CueItem`, `CueItemPool`. Their
  constructors end with `return this.proxify([...])`; `Chase` and `FX` call it twice. The
  array helpers `pushAndStackUndo` / `spliceAndStackUndo` that `proxify()` attaches have no call
  site anywhere: every array already uses plain `push` / `splice`. What remains are 24
  `// TODO: replace with ..AndStackUndo once patched` comments in `cue.pool`, `cue.item.pool`,
  `chase.pool`, `chase`, `effect` and `fixture.pool` models, and instructions to use the helpers in
  `CLAUDE.md`, skill `dmx-model-change` and `openspec/config.yaml`.
- Other users: `Show` (`static undo/redo`, and `ProxifySingleton.on('changed')` setting
  `isSaved = false`), `plugins/router.js` (`on('undo')` navigation), toolbar Edit menu
  (calls `this.$show.undo()/redo()`, which throws).
- Unsaved marker today: `Show.isSaved`, emitted as `saveState` and rendered by the toolbar as `*`.
  Set to `true` by `persistLocally()` and after load; set to `false` only by `changed`.
- `Show.showData` contains name, bpm, fixtures, universes, groups (cues, chases), visualizer
  preferences and outputs. No playback field (cue/chase state, time, elapsed, DMX activity,
  channel values) is in it.
- `main.js` exposes `reactive(ShowSingleton)`; `Fixture._3DModel` (MovingHead) and
  `Show.visualizerHandle` (renderer, scene, camera) are deeply reactive. The UI reads playback
  values reactively (play icons, `chase.elapsedPerc`, `cue.time`, `group.DMXActivity`,
  `simplifiedChannels`), so those must stay reactive.

## Goals / Non-Goals

**Goals:**
- No proxy layer and no per-write bookkeeping in the engine.
- An unsaved marker that is correct by construction and blind to playback.
- Three.js and the visualizer outside Vue reactivity.

**Non-Goals:**
- Any replacement undo, history API or keyboard shortcut. Nothing is kept "for later": the
  future `add-undo-redo` will be opt-in edit transactions on the new show document and shares no
  code with Proxify.
- Removing Vue reactivity from playback values (belongs to `decouple-visualizer-from-models`).

## Decisions

1. **Delete Proxify outright.** Remove `extends Proxify`, the `super()` calls that only served it,
   every `proxify()` call (constructors return implicitly), the imports, and the file. Delete all
   24 `..AndStackUndo` TODO comments; the plain `push` / `splice` they sit on stay as they are.
   *Alternative:* keep Proxify with a no-op handler. Rejected: dead code with a misleading API.

2. **Unsaved marker by snapshot comparison.** `Show` keeps `_savedSnapshot`, the
   `JSON.stringify(this.showData)` string taken at save (`persistLocally`) and after load / new
   show. A new `Show.refreshSaveState()` compares the current string with it, sets `isSaved` and
   emits `saveState` only when the value changes. The toolbar fragment, which already owns the
   `saveState` subscription, calls it on window `pointerup`, `keyup` and `change`, debounced to
   250 ms, and removes the listeners on unmount.
   *Alternatives:* explicit `markDirty()` at every edit site (many sites, easy to miss); a deep Vue
   watcher on `$show` (fires on playback and is costly at 60 fps). Snapshot comparison follows
   persisted data only, so playback can never trigger it, and reverting an edit clears the `*`.
   Cost: one serialization per edit gesture, not per tick.

3. **`markRaw` render objects where they are created.** `Fixture.prepare3DModelInstance()` wraps
   the `MovingHead` with `markRaw` from `vue`; `visualizer.fragment.vue` assigns
   `markRaw(new Visualizer(...))`. The model importing `vue` is temporary and disappears with
   `_3DModel` in `decouple-visualizer-from-models`.
   *Alternative:* `shallowReactive($show)`. Rejected: the UI relies on deep reactivity for edits
   and playback read-outs.

4. **Remove the Edit menu entirely.** It holds only Undo and Redo, and Ctrl+Z/Ctrl+Y were never
   bound.

**Per-tick cost:** removes, per model write: a proxy trap, 2 closures, an array push, an O(n)
`shift()` when the stack is full, 2 event emits and a reactive `isSaved` write. Adds nothing.

**Showfile / load path:** `showData` and `Show.loadFromData` are unchanged; only the snapshot is
taken at the end of load.

## Risks / Trade-offs

- [Code relied on getting the proxy rather than the instance, or on `this.except`] → none found
  in a search; check that patching, grouping, cues, effects and chases still work end to end.
- [A save path other than `persistLocally` and load (export, new show) leaves a stale snapshot]
  → take the snapshot in each place that sets `isSaved = true` today (`show.model.js` lines that
  set it, and `popup.newshow.vue`).
- [Large shows make each snapshot comparison noticeable] → 250 ms debounce, edit gestures only.
  Revisit with a hash or dirty flags in the new show document.
- [`markRaw` breaks a binding that relied on MovingHead reactivity] → check selection highlight
  and the move/rotate gizmo.

## Migration Plan

No data migration. Rollback is reverting the commit.

## Open Questions

- Exact before/after frame times: measured during implementation, reported in the PR.
