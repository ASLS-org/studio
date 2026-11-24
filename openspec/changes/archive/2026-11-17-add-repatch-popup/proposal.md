# Proposal

## Why

Moving a fixture means typing a new number in Fixture Settings' *Address* without seeing what is
free, and the field writes the address straight onto the fixture: the universe's patch map isn't
updated, so the old range still reads as taken and the new one as free. Addresses also show
0-based (`U0-CH0`) where every DMX desk and fixture display counts 1 to 512. Fixtures hung
mirrored or on their side need their pan or tilt reversed or swapped, which Studio can't do.

## What Changes

- **Addresses 1–512:** every address shown (patch bay, Fixture Settings, patch popup, maps) is
  the DMX address. Showfiles keep storing 0-based.
- **Repatch popup:** Fixture Settings shows *Ch Start*, *Ch Stop* and *Ch Count* read-only and an
  *Edit* header button. The popup shows a universe map (512 slots, 32 per row) with each fixture
  as a block (name, range); drag selected blocks, clamped to 1–512, never onto another fixture. A
  side panel holds the universe and selection selects, the before/after changes, *Move to free
  range*, *Remove gaps*, *Reset* and warnings. The selection is highlighted in 3D. Moves are a
  draft applied on *OK*.
- **Patch popup:** the same map, read-only, shows the range about to be patched (red when taken,
  with a message naming what holds it); identical fixtures are numbered (`Spot 1`, `Spot 2`); the
  position, rotation and offset fields go (the Position Tool places fixtures).
- **Invert pan, Invert tilt, Swap pan/tilt** in the engine only: per-fixture options saved with
  the fixture and applied to its DMX output. Their controls come with the position tool rework.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `patching`: 1-based addresses, the repatch popup, the patch popup's map, pan/tilt invert and
  swap, the patch map kept consistent.

## Impact

- Showfile format: fixtures gain `invertPan`, `invertTilt`, `swapPanTilt` (absent = off in older
  files). Addresses unchanged on disk.
- Unsaved marker: a repatch or a checkbox marks the show unsaved.
- Live playback/timing: none.
- WSC output: inverted/swapped bytes for those fixtures; repatched fixtures output at their new
  address.
- Visualizer: follows the output; repatching rebuilds the patch as today.
- Web vs Electron: same.

**Out of scope:** the output universe number; per-cell invert; patching several new fixtures by
dragging in the patch popup.

**Manual:** `programming/patching` (addresses, Fixture Settings, repatch, patch popup map),
`getting-started/interface` (patch bay addresses).
