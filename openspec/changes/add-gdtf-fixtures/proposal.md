# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 5.

## Why

The built-in library is a limited OFL snapshot, and only Moving Head fixtures can be patched,
because the 3D view has one hard-coded model. Operators need the fixtures they actually rig: PARs,
bars, washes, pixel fixtures, multi-cell beams. GDTF is the industry format that describes both
the DMX behaviour and the physical fixture (geometry, beams, wheels, models).

## What Changes

- Import GDTF fixtures (`.gdtf` files) through a GDTF adapter that produces the unit 1 profile,
  plus a geometry tree (bodies, axes, beams) and the fixture's wheel images.
- A generic fixture renderer walks the geometry tree: axes take Pan/Tilt, every beam geometry
  becomes a projector, so multi-beam and pixel fixtures work. Uses GDTF `gltf_low`, `gltf` and
  `gltf_high` models per quality tier, with a polygon budget.
- GDTF wheel images feed the gobo texture array, so real gobos appear on surfaces and in haze.
- OFL fixtures of any category get a fallback geometry, so the Moving Head-only limit goes away.
- The patch popup lists imported GDTF fixtures next to the built-in library; showfiles reference
  them so a saved show reopens with the same fixtures.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `fixtures`: GDTF fixtures, any category, multi-beam behaviour.
- `showfile`: fixtures referenced from imported GDTF files.

New capability `patching` (importing and choosing GDTF fixtures) if it has no spec yet.

## Impact

- Showfile format: backward compatible for existing files; new fixture source key for GDTF
  fixtures. Whether the file embeds GDTF data or references a local library is decided while
  refining.
- Undo/redo: none.
- Live playback/timing: none.
- WSC output: none.
- Visualizer: generic geometry for every fixture; per-type instancing and LOD.
- Web vs Electron: import works in both; GDTF Share download possibly Electron-only (CORS).
- Code: new GDTF adapter (zip + XML; `xml2js` is already a dependency, a zip library is new),
  geometry renderer, patch popups, `show.model.js` load path.

## Out of scope

- MVR import, fixture editing, GDTF export.
- GDTF Share browsing if refining shows it needs Electron fixes first (epic backlog).

## User manual

Patching pages: importing GDTF fixtures and choosing them; remove the Moving Head-only note if the
manual has one. Fixture library wording in the patch popup.
