# Proposal

## Why

Placing a rig is done one fixture and one field at a time: the Position Tool edits only the first
selected fixture, even though the fixture pool and the 3D gizmo already handle several. Lines,
circles, grids and fixtures aimed at one spot have to be computed by hand.

## What Changes

- **Multi-selection:** the Position Tool edits every selected fixture. A field shows the shared
  value or `--` when they differ; typing sets it on all; the arrows nudge each one by a step from
  where it is. The header shows how many are selected.
- **Readable layout:** a stage map seen from above (click to select, drag to move on a 0.25 m
  grid), X / Y / Height, and the rotation as a mount (floor, hung, walls, front) with a turn and
  a tilt instead of three Euler angles.
- **Arrange popup** (header button and the **A** key): Line, Grid, Circle, Arc, Align, Distribute,
  Fan and Aim, each with an icon, a search box. Fixtures move live in 3D; *Apply* keeps the
  result and stays open to combine modes, *OK* keeps it, *Cancel* restores.
- The 3D gizmo keys (T, R, H, Escape, Ctrl+Z) go through the app's one key path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `patching`: placing several fixtures, arranging them.

## Impact

- Showfile format: none (positions and rotations are already saved).
- Unsaved marker: every placement edit and *OK* in Arrange mark the show unsaved; an open
  Arrange draft does too until *Cancel*.
- Live playback/timing: none.
- WSC output: none.
- Visualizer: follows positions as today; the gizmo keeps working with the selection.
- Web vs Electron: same.

**Out of scope:** raw X/Y/Z rotation fields (mounts cover them); mirroring and mirrored copies;
invert/swap controls (engine only, from `add-repatch-popup`); undo; arranging along a drawn path; smart placement when patching (follows
this unit).

**Manual:** `programming/patching` (Position Tool), `interface/visualizer` (placing fixtures),
`reference/shortcuts` (A), preset `fixture-position`.
