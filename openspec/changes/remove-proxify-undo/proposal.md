# Proposal

## Why

Undo/Redo has not worked since the Vue 3 migration: the menu items throw, and undo writes bypass
Vue so the screen would not update anyway. The layer behind it (Proxify) still runs on every
model write, including every playback tick: each running effect queues undo entries at 60 per
second, which costs closures, an O(n) stack trim and save-state events, and stalls the app. The
show graph, including Three.js objects, is also deeply reactive. Removing the dead layer is the
cheapest, largest performance win before the engine and visualizer decoupling. A fresh undo will
be built later on the new show document.

## What Changes

- **BREAKING (feature removal):** Undo and Redo are removed. The toolbar Edit menu, which only
  holds them, is removed.
- The Proxify undo layer is removed: models become plain classes and stop recording writes.
- The unsaved marker (`*` before the project name) is driven by comparing the show's saved data
  with the last saved version after each edit gesture, so playback never sets it and reverting an
  edit clears it.
- 3D fixture instances and the visualizer are kept out of Vue reactivity. Playback values the UI
  displays (play state, playheads, meters, channel faders) stay reactive.
- A Performance recording with effects running is taken before and after.

## Capabilities

### New Capabilities
- `showfile`: when the show is marked as having unsaved changes.

### Modified Capabilities
- none

## Impact

- Showfile format: none. No persisted field changes; older showfiles load unchanged.
- Undo/redo: removed until `add-undo-redo`.
- Live playback/timing: none functionally; less per-tick work, so fewer stalls.
- WSC output: none (same DMX values).
- Visualizer: none visually; 3D instances stop being reactive.
- Web vs Electron: same in both.
- Code: `models/utils/proxify.utils.js` (deleted), the 12 model files that import it
  (including `show.model.js`), `plugins/router.js`, toolbar fragment, visualizer fragment.

## Out of scope

- A new undo/redo (future change `add-undo-redo`, after the show document/runtime split).
- Capability lookup allocations in `Fixture.setChannel` and the models-to-visualizer coupling
  (changes `add-fixture-profile`, `decouple-visualizer-from-models`).
- Moving the engine or the visualizer to a Web Worker.

## User manual

Toolbar page: remove the Edit Menu section and its screenshots, update "four subsections" to
three, and add a note that Undo/Redo are not available in this version.
