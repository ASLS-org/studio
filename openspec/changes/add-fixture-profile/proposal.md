# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 1.

## Why

The engine is written against the Open Fixture Library JSON shape: `Fixture`, `Channel` and
`Capability` parse `availableChannels`, OFL capability types, the `" fine"` naming and
`categories[0]` directly. GDTF cannot plug in without rewriting them, and every channel write pays
for an `Array.find` over capabilities plus a freshly allocated value object. The fixture mode the
operator picks is also lost on reload (`Fixture.showData` writes `this.modeNam`, a typo).

## What Changes

- An internal fixture profile: modes, channels with a standard attribute (GDTF attribute names),
  coarse/fine resolution, DMX ranges mapped to capabilities, wheels and physical data (beam angle,
  colour temperature). Profiles are plain data, built once per fixture type and shared.
- An OFL adapter that turns the bundled library's JSON into profiles. The engine reads only
  profiles.
- Channel value resolution uses a precomputed DMX-value-to-capability table instead of a search
  and an allocation per write.
- The selected fixture mode is saved and restored. Older showfiles without a mode keep loading
  with the first mode, as today.

## Capabilities

### New Capabilities
- `fixtures`: how a patched fixture's modes, channels and fine channels behave, and that its mode
  survives save and reload.

### Modified Capabilities
- none

## Impact

- Showfile format: backward compatible. The mode is now actually written; files without it load
  with the first mode.
- Undo/redo: none (not available).
- Live playback/timing: none functionally; cheaper channel writes.
- WSC output: none (same DMX values).
- Visualizer: none (still driven by `Fixture` until unit 2).
- Web vs Electron: same.
- Code: `fixture.model.js`, `channel.model.js`, `capabilityManager.model.js`,
  `fixture.pool.model.js`, `show.model.js` (fixture loading), patch popups that read OFL data.

## Out of scope

- GDTF parsing (unit 5).
- Moving the 3D instance out of `Fixture` (unit 2).
- Rendering fixture categories other than Moving Head (unit 5).

## User manual

Check the Patching pages for wording about modes; add that the chosen mode is kept when the show
is saved, if the page describes modes. Otherwise n/a.
