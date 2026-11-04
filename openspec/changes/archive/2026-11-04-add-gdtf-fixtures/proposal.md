# Proposal

Epic `gdtf-render-pipeline`, unit 5a. Fixture 3D models follow in 5b (`add-gdtf-models`).

## Why

Operators can only patch Moving Heads from a limited OFL snapshot. They need the fixtures they
rig: PARs, bars, washes, pixel and multi-cell fixtures. GDTF, the industry format, describes both
the DMX behaviour and the physical fixture (geometry, beams, wheels).

## What Changes

- **Import `.gdtf` files** (picker or drop) into a fixture library on the device. The app ships
  only generic GDTF fixtures written for the project, with our own gobo images; no third-party
  files (they are copyrighted by default).
- **GDTF adapter** builds the same internal profile as OFL fixtures, plus a geometry tree
  (bodies, pan/tilt axes, beams) and wheel slot images.
- **Any category patches**: the Moving Head-only limit goes away for OFL and GDTF fixtures.
- **Generated bodies** for every fixture from its facts: category, dimensions, lens, pan/tilt
  ranges and cell layout (yoke and head, can, bar, panel). Real GDTF models come in 5b.
- **Per-beam rendering**: axes take Pan/Tilt, every beam or cell follows its own channels, for
  GDTF and for OFL pixel fixtures (OFL matrix channels are expanded per cell).
- **Real gobos** from GDTF wheel images, on surfaces and in haze.
- **Patch popup** lists the imported and bundled GDTF fixtures next to the OFL library.
- **Showfiles reference GDTF fixtures** by type; a show whose fixture is missing asks for it.

## Capabilities

### New Capabilities
- `patching`: GDTF import, the GDTF library, any category.

### Modified Capabilities
- `fixtures`: GDTF fixtures; per-cell channels.
- `showfile`: GDTF references, missing fixtures.
- `visualizer`: generated bodies, per-beam rendering, GDTF gobos.

## Impact

- Showfile format: GDTF fixtures save as `source: "gdtf"` plus their fixture type ID. Older
  files load unchanged, except about 14 OFL Moving Heads with pixel channel blocks (none in the
  demo): their channel list grows to the real one, shifting their saved scenes.
- Unsaved marker: importing into the library doesn't mark the show unsaved.
- Live playback/timing: none.
- WSC output: none.
- Visualizer: generic fixture class next to `MovingHead`; gobo images from wheels.
- Web vs Electron: same behaviour; the library lives in IndexedDB in both.

## Out of scope

- GDTF glTF / 3ds models and LOD (unit 5b), MVR import, fixture editing, GDTF export.
- GDTF Share browsing and download (epic backlog, needs Electron fixes and API access).
- Third-party GDTF files in the bundle (manufacturer permission, later).
- GDTF mode masters, sub-physical units, connectors.

## User manual

Patching pages: importing GDTF fixtures, the library, missing fixtures on open. Visualizer page:
remove the "moving heads only" note. Fixture library wording in the patch popup.
