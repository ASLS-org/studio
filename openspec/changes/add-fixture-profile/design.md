# Design

Draft from the epic planning (2026-11-03). Refine in the unit branch before writing specs and
tasks.

## Context

See proposal.md and the epic doc § Findings. Today `Show.prepareFixtures()` fetches each OFL JSON
(`fixtures/<manufacturer>/<model>.json`, cached as a string per type) and passes it to
`FixturePool.addRaw()`. `Fixture.parseFromOFLData()` deep-copies the OFL data per instance
(`JSON.parse(JSON.stringify(...))` in `prepareChannels`), builds `Channel`s whose `type` is
derived from OFL capability types, links fine channels by alias name, and builds quick accessors
keyed by those types (`Dimmer`, `Color`, `Pan`, ...). UI widgets read quick accessors and
`simplifiedChannels`.

## Goals / Non-Goals

**Goals:**
- One profile shape that both OFL and GDTF adapters produce, so unit 5 adds an adapter only.
- O(1), allocation-free channel value resolution.
- Same behaviour as today for every fixture the engine supports now.

**Non-Goals:**
- Changing where runtime DMX values live (unit 2 moves the visualizer onto DMX frames).
- New UI.

## Decisions

1. **GDTF attribute names as the internal vocabulary** (`Dimmer`, `Pan`, `Tilt`, `ColorAdd_R`,
   `Gobo1`, `Zoom`, `Shutter1`, ...). GDTF is the target format and its attribute list is the
   richer one; the OFL adapter maps OFL capability types onto it. Quick accessors are rebuilt on
   attributes, keeping the existing accessor keys as aliases so the UI keeps working.
   *Alternative:* keep OFL types internally. Rejected: GDTF would then need lossy mapping.
2. **Profiles are immutable plain data shared per fixture type and mode**, cached by
   `source/manufacturer/model/mode`, kept out of Vue (`markRaw`). Removes the per-instance deep
   copy.
3. **Per channel, a 256-entry lookup** (`Uint8Array` of capability indexes) built at profile time;
   capability value maths returns into a reused output object.
4. **Fine channels are part of the channel definition** (coarse/fine/ultra byte offsets) instead
   of being resolved by alias name at patch time.
5. **Mode persistence**: write `mode` from `modeName`; on load, use `data.mode` when it names an
   existing mode, otherwise the first mode.

## Risks / Trade-offs

- [OFL edge cases: switching channels, matrix/pixel fixtures, unusual fine aliases] → the adapter
  covers what the engine handles today; anything else maps to an `Unknown` attribute and is
  reported once per fixture type.
- [UI code depending on OFL-derived channel `type` strings] → keep those strings as aliases in
  this unit; remove them in a later cleanup.

## Open Questions (resolve while refining this unit)

- Where the profile module lives (`src/models/fixtures/` vs `src/models/DMX/profile/`).
- Whether the showfile records the profile source (`ofl`) now or in unit 5.
