# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 1.

## Why

`Fixture`, `Channel` and `Capability` parse Open Fixture Library JSON directly, and the patch
popup and show loader each fetch and deep-copy OFL files. GDTF cannot plug in without rewriting
it, and every channel write pays for a capability search plus a new value object. Two bugs come
from the same code: a fixture patched in a chosen mode is built in its first mode (the popup sends
an index, the model expects a name), and the mode is never saved (`showData` writes
`this.modeNam`).

## What Changes

- An internal fixture profile: modes, channels with a standard attribute (GDTF attribute names)
  and the existing channel type key, coarse/fine resolution, DMX ranges mapped to capabilities,
  wheels and physical data. Built once per fixture type, shared, immutable.
- An OFL adapter producing profiles, and one fixture library loader used by both the patch popup
  and the show loader.
- Channel value resolution through a precomputed DMX-value-to-capability table, with no
  allocation per write.
- Fixtures are built in the mode chosen when patching, and that mode is saved and restored.
- 16-bit channels split correctly: coarse gets the integer part (today it is rounded up, so
  fractional values overshoot by up to one coarse step).
- Each saved fixture records its profile source (`ofl`), so GDTF fixtures can be added later.

## Capabilities

### New Capabilities
- `fixtures`: fixture modes when patching and across save/reload, fine channels, and older
  showfiles' scenes driving the same channels.

### Modified Capabilities
- none

## Impact

- Showfile format: backward compatible. Fixtures gain `mode` (now actually written) and
  `source`; files without them load with the first mode and `ofl`. Scene channel keys unchanged.
- Undo/redo: none (not available).
- Live playback/timing: none functionally; cheaper channel writes.
- WSC output: none for existing shows; fixtures patched in a non-default mode now output that
  mode's layout.
- Visualizer: none (still driven by `Fixture` until unit 2).
- Web vs Electron: same.
- Code: new `src/models/fixtures/`; `fixture.model.js`, `channel.model.js`,
  `capabilityManager.model.js`, `show.model.js`, universe patch popup.

## Out of scope

- GDTF parsing (unit 5), moving the 3D instance out of `Fixture` (unit 2), other categories.
- Patch overlap check and saved fixture ids: fixed separately (quickwin `13a8d86` on develop,
  hotfix PR #63).

## User manual

Universe modifier page, fixture settings table: say the Mode is saved with the show.
