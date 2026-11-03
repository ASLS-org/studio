# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 2.

## Why

The show models drive the 3D view directly: `fixture.model.js` imports `MovingHead` and
`Controls`, and every channel write pushes values into Three.js on the spot. That makes the models
impossible to run without the visualizer, puts 3D work inside every playback write, and blocks
both a new renderer and moving the visualizer off the main thread. The visualizer can also show
something different from what the hardware receives.

## What Changes

- The visualizer becomes a DMX consumer: once per rendered frame it reads the universes' DMX
  frames and the patch (fixture id, universe, address, profile, position, rotation), decodes the
  channels through each fixture's profile, and fills one per-beam state buffer.
- The current `MovingHead` renderer is fed from that buffer, so the look and the supported
  fixtures stay the same in this unit.
- `Fixture` no longer owns a 3D instance. Selection highlight, centring and the move/rotate gizmo
  go through a visualizer API keyed by fixture id; gizmo edits come back as events that update the
  fixture's position or rotation.
- The visualizer API is message-shaped (data in, events out) so unit 3 can move it into a Worker
  without changing callers.

## Capabilities

### New Capabilities
- `visualizer`: the 3D view shows exactly the DMX values being output, and fixture selection,
  highlight and placement behave as before.

### Modified Capabilities
- none

## Impact

- Showfile format: none.
- Undo/redo: none (not available).
- Live playback/timing: cheaper ticks (no 3D work per channel write).
- WSC output: none; the visualizer reads the same buffers the output sends.
- Visualizer: same look; one frame of latency at most.
- Web vs Electron: same.
- Code: `fixture.model.js`, `universe.model.js`, `show.model.js`, `plugins/visualizer/*`,
  fixture position/rotation widgets, patch and group views that call `highlight*`.

## Out of scope

- New rendering (units 3 and 4), Worker/OffscreenCanvas (unit 3).
- Other fixture categories (unit 5).
- Moving the engine itself into a Worker (epic backlog).

## User manual

n/a: no visible change.
