# Proposal

## Why

What is in view and what is selected is kept in several places that drift apart: the router,
the group pool, the cue pool, the modifiers, the fixture pool and the lists. Popups are 17
separate flags, and six components each listen to the whole window for keys. After deletes,
reloads or quick switches, a panel can show stale data, a key can reach the wrong block, and
the 3D highlight shows whatever was written last. The first group view also compiles a shader,
which blocks the main thread, and DMX output with it, for 130 to 160 ms.

## What Changes

- One view state is the single source of truth for the panel in view, the selection (held by
  id, falling back when an item is deleted) and the open popups.
- Each group remembers its cue and fixtures, and each universe its fixture and cells, for the
  session.
- The 3D highlight follows the selection in view.
- Popups form one stack: Escape closes the top one. Keys go to that popup first, then to the
  focused panel, then to global shortcuts.
- Panel routes are removed. The router keeps the app and `/visualizer`.
- Shaders are compiled at boot.
- A new `npm run app:check` drives these flows with real clicks and keys in headless Chrome,
  and fails on any main-thread block over 50 ms.

## Out of scope

- New show features.
- Saving the view state, URLs or deep links.
- `move-visualizer-to-worker`.
- Popup or panel restyling.

## Capabilities

### New Capabilities

- `navigation`: the panel in view, selection, memory per group and universe, fallback after
  deletes, switching without blocking.

### Modified Capabilities

- `uikit`: the popup stack and key routing.
- `visualizer`: the highlight follows the selection in view.

## Impact

- **Code:**
  - new `src/views/view.state.js` (`$view`, also set in the manual's preview host);
  - the router;
  - the modifiers, the group pool, the patch bay, the pool widgets and the popups;
  - `uk-popup` and the toolbar;
  - the visualizer's boot.
- **Tooling:** new `scripts/app-check.mjs`, with no new dependencies.
- **Showfile:** none.
- **Unsaved marker:** none.
- **Live timing:** none, though switches no longer block.
- **WSC output:** none, though it no longer stalls on the first group view.
- **Visualizer:** shaders compile at boot, and the highlight follows the selection.
- **Web and Electron:** the same.

Manual:
- `getting-started/interface` (modifier strip, remembered selection);
- `reference/shortcuts` (popup stack, key routing);
- `programming/groups` and `programming/patching`;
- `npm run docs:manual:check`.
