# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 2.

## Why

The show models drive the 3D view directly: every channel write pushes values into Three.js, and
`fixture.model.js` imports `MovingHead` and `Controls`. Playback writes also go through Vue, so an
animated fixture re-renders its widgets on every tick. Output is fragile too: the WSC stream is a
`Live` animation, so it sends one tick late when started before a cue, and sends nothing while the
show is paused. This blocks the new renderer and any Worker.

## What Changes

- Each universe packs its channels into one persistent 512-byte frame after every engine tick.
  Streams send that frame right after packing, also while the show is paused or stopped.
- The visualizer reads those frames each rendered frame and decodes them through the fixture
  profiles. Same look and fixture support as today.
- `Fixture` no longer owns a 3D instance. Highlight, focus and placement calls keep their API but
  become events the visualizer handles; the move/rotate gizmo reports changes back as events.
- Playback writes bypass Vue. Widgets showing live values (channel faders, pan/tilt, colour
  picker, cue progress, chase playheads, activity meters) refresh from a shared UI ticker at about
  25 Hz, and immediately after an operator edit.

## Capabilities

### New Capabilities
- `visualizer`: the 3D view shows the values being output; selection and placement behave as
  before.
- `output-wsc`: frames keep being sent while the show is paused or stopped.
- `uikit`: live-value widgets follow playback and edits.

### Modified Capabilities
- none

## Impact

- Showfile format: none.
- Undo/redo: none (not available).
- Live playback/timing: no 3D work or Vue updates per write; output sends the values of the
  current tick.
- WSC output: **behaviour change**: output continues while paused or stopped (playback freezes,
  hardware keeps the current values, live edits are sent).
- Visualizer: same look; at most one frame between engine and view.
- Web vs Electron: same.
- Code: `live.model.js`, `universe.model.js`, `universe.pool.model.js`, `fixture.model.js`,
  `cue.model.js`, `chase.model.js`, `show.model.js`, `plugins/wsc.connection.js`,
  `plugins/visualizer/*`, a new UI ticker, about 6 live-value widgets.

## Out of scope

- New rendering and the visualizer Worker (unit 3).
- Engine in a Worker with the universe buffer as the only value storage (epic backlog).
- Fixture categories other than Moving Head (unit 5).

## User manual

Toolbar page, Inputs/Outputs: output keeps running while the show is paused or stopped.
