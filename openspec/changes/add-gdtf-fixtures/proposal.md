# Proposal

Epic `gdtf-render-pipeline`, unit 5a. Fixture 3D models follow in 5b (`add-gdtf-models`).

## Why

Operators can only patch Moving Heads from a limited OFL snapshot. They need the fixtures they
rig: PARs, bars, washes, pixel and multi-cell fixtures. GDTF, the industry format, describes both
the DMX behaviour and the physical fixture (geometry, beams, wheels).

## What Changes

- **Import `.gdtf` files** (picker or drop) into a fixture library on the device. A curated set
  of redistributable GDTF files ships with the app.
- **GDTF adapter** builds the same internal profile as OFL fixtures, plus a geometry tree
  (bodies, pan/tilt axes, beams) and wheel slot images.
- **Any category patches**: the Moving Head-only limit goes away for OFL and GDTF fixtures.
- **Generic fixture rendering**: axes take Pan/Tilt, every beam is a projector with its own
  channels, so multi-cell and pixel fixtures work. Bodies are proxy shapes (real models in 5b);
  non-Moving-Head OFL fixtures get one body and one beam.
- **Real gobos**: GDTF wheel images replace the built-in patterns on surfaces and in haze.
- **Patch popup** lists the imported and bundled GDTF fixtures next to the OFL library.
- **Showfiles reference GDTF fixtures** by fixture type; opening a show whose fixture is missing
  on this device asks to import it.

## Capabilities

### New Capabilities
- `patching`: importing GDTF fixtures, the local and bundled GDTF library, patching any category.

### Modified Capabilities
- `fixtures`: GDTF fixtures play like OFL fixtures; multi-cell fixtures.
- `showfile`: GDTF fixture references and missing fixtures on open.
- `visualizer`: any fixture renders; multi-beam fixtures; GDTF gobo images.

## Impact

- Showfile format: fixtures gain `source: "gdtf"` with the GDTF fixture type ID. Older showfiles
  are unchanged (OFL is the default source).
- Unsaved marker: importing a fixture into the library does not mark the show unsaved; patching
  does, as today.
- Live playback/timing: none.
- WSC output: none.
- Visualizer: generic fixture class next to `MovingHead`; gobo images from wheels.
- Web vs Electron: same behaviour; the library lives in IndexedDB in both.

## Out of scope

- GDTF glTF / 3ds models and LOD (unit 5b), MVR import, fixture editing, GDTF export.
- GDTF Share browsing and download (epic backlog, needs Electron fixes and API access).
- OFL matrix / pixel definitions (OFL multi-cell fixtures render as one beam).
- DMX mode masters, sub-physical units and connectors (ignored).

## User manual

Patching pages: importing GDTF fixtures, the library, missing fixtures on open. Visualizer page:
remove the "moving heads only" note. Fixture library wording in the patch popup.
