# Proposal

## Why

Patching drops every new fixture at the centre of the stage, on the floor, all on top of each
other. Since the patch popup lost its position fields (unit 7), the first thing after each patch
is to pull the fixtures apart in the Position Tool, one by one.

## What Changes

- New fixtures get a sensible pose when patched: in a line along X, 1 m apart and centred, hung
  4 m up (mount *Hung*). Smoke machines, hazers, fans and stands stand on the floor instead.
- The line goes on the first row nothing is in the way of, so a second patch doesn't land on the
  first: hung fixtures try 3 m in front of the stage's centre, then over it, behind it, further
  out; floor units try the back of the stage first. Fixtures of every universe count.
- When every row is taken, the line carries on to the right of the first row.
- The patch popup gets no new field: the Position Tool and Arrange adjust the result.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `patching`: where newly patched fixtures are placed.

## Impact

- Code: `views/utils/placement.js` (`patchPoses`), the patch popup, the app check.
- Showfile format: none (positions and rotations were already saved); older showfiles load as
  before, fixtures already patched don't move.
- Unsaved marker: none beyond the patch itself. Live playback/timing, WSC output: none.
- Visualizer: new fixtures appear hung in a line instead of stacked at the origin.
- Web vs Electron: none.

## Out of scope

- Placement settings in the patch popup (row, height, spacing).
- Spacing from the fixture's physical size, or matching an existing rig's height.
- Re-placing fixtures already patched.

Manual: `programming/patching.md` (Patching a Fixture, `patch-add` demo) and
`getting-started/first-show.md` (patching two PARs).
