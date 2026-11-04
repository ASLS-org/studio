# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 6 (optional).

## Why

The visualizer draws on the main thread, next to the show engine and the editor. Since unit 3 it
only draws when something changes, so the main thread is mostly idle while nothing moves. During
playback with a busy editor, though, a heavy frame can still delay the engine tick and the UI.
This unit runs only if the end-of-epic smoke and performance tests show that cost matters.

## What Changes

- The renderer runs in a module Worker drawing to an `OffscreenCanvas`, with the same module on
  the main thread when `transferControlToOffscreen` is missing.
- The visualizer fragment sends the patch snapshot, pose, highlight and settings; changed
  universe frames are copied to the worker once per tick (512 bytes per universe).
- Pointer, wheel, keyboard and resize events are forwarded for orbit; gizmo picking and drags run
  in the worker and report `fixture_transformed` back.
- Canvas recording (`captureStream`) and the popped-out visualizer window keep working.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `visualizer`: rendering does not wait for the editor.

## Impact

- Showfile format: none.
- Live playback/timing: the main thread no longer draws frames.
- Visualizer: same picture; orbit and gizmo input cross a thread boundary (measure input latency).
- Web vs Electron: static assets load through `VITE_STATIC_URL` from the worker.
- Code: `plugins/visualizer/*`, visualizer fragment and activity, `controls.js`.

## Out of scope

- Moving the show engine itself to a Worker (epic backlog).
