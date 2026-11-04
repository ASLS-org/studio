# Design

Refined in the unit branch on 2026-11-04. Product decisions from the user: GDTF files come from
file import plus a curated bundle; showfiles reference a local library; glTF models move to unit
5b (`add-gdtf-models`).

## Context

Units 1-4 provide what this unit builds on:
- **Profiles.** `FixtureProfile` (`src/models/fixtures/fixture.profile.js`) already has a `source`.
  `FixtureLibrary.getProfile(source, manufacturer, model)` dispatches on it and caches one frozen
  profile per type.
- **Capabilities.** `Capability` (`models/DMX/capabilityManager.model.js`) is built from
  OFL-shaped capability data. Channel `type` keys come from `deriveTypeKey` in `ofl.adapter.js`.
- **The 3D view.** `FixtureRenderer` decodes universe frames through profile channels into a
  `MovingHead`, which writes beam rows into `BeamState`. Every lighting pass reads `BeamState`
  only.

Today, `Fixture.parseFromProfile()` throws for any category other than `Moving Head`, and
`FixtureRenderer.createInstance()` always builds a `MovingHead`.

A `.gdtf` file is a zip holding:
- `description.xml`: fixture type, attribute definitions, wheels, physical descriptions, models,
  geometries, and DMX modes. A mode holds DMX channels; each channel holds logical channels,
  channel functions and channel sets.
- `wheels/*.png`: the wheel slot images.
- `models/`: the 3D models (unit 5b).

## Goals / Non-Goals

**Goals:**
- Any GDTF fixture imports, patches, plays and renders with its beams in the right place, each
  beam driven by its own channels.
- Every OFL fixture patches. Non-Moving-Head fixtures render with a proxy body and one beam.
- Existing showfiles, scenes and OFL Moving Heads behave exactly as before.

**Non-Goals:**
- GDTF 3D models and LOD (5b).
- Full GDTF coverage: DMX mode masters, sub-physical units, connectors, and relations other than
  fine channels are ignored. Anything unmapped becomes the `Unknown` attribute.

## Decisions

### 1. The GDTF adapter emits OFL-shaped capabilities

`gdtf.adapter.js` stays pure, like the OFL adapter: no Vue, Three.js or `import.meta`. It takes
the parsed `description.xml` and returns a `FixtureProfile`. For each DMX mode, it maps every DMX
channel to profile channels:
- **Coarse and fine bytes.** `Offset="1,2"` gives a coarse channel plus fine channels. They are
  paired through `fine` and carry `isFine` / `FineChannelAliases`, as OFL fine channels are.
- **Capabilities.** Each channel function of the channel's first logical channel becomes one
  capability. Its `range` runs from its `DMXFrom` (scaled to the coarse byte) to one below the
  next function's `DMXFrom`. Its OFL `type` and entities come from the GDTF attribute:

| GDTF attribute | Capability data |
|---|---|
| `Dimmer` | `Intensity`, brightness from PhysicalFrom/To |
| `Pan`, `Tilt` | `Pan` / `Tilt`, `angleStart` / `angleEnd` from PhysicalFrom/To (degrees) |
| `PanRotate`, `TiltRotate` | `PanContinuous` / `TiltContinuous` |
| `ColorAdd_*`, `ColorRGB_*`, `ColorSub_*` | `ColorIntensity` with the matching OFL colour |
| `Color1`... (wheel) | `WheelSlot`, wheel name, `slotNumber` from the channel set's `WheelSlotIndex` |
| `Gobo1`, `Gobo2` (wheel) | `WheelSlot` as above; `Gobo1PosRotate` → `WheelSlotRotation` |
| `Shutter1`, `Shutter1Strobe*` | `ShutterStrobe` (open, closed, strobe, from the function name) |
| `Zoom` | `Zoom`, `angleStart` / `angleEnd` in degrees |
| `Focus1`, `Iris`, `Frost1`, `Prism1`, `Prism1PosRotate`, `CTO` | `Focus`, `Iris`, `Frost`, `Prism`, `PrismRotation`, `ColorTemperature` |
| anything else | `Generic` |

- **Channel `type`.** It comes from the same `deriveTypeKey` as OFL. `deriveTypeKey` and the
  attribute tables move from `ofl.adapter.js` into a shared module, unchanged. GDTF channel
  names follow OFL naming, so `type` keys match, and the renderer's existing `Color Wheel` /
  `Gobo Wheel` checks hold: `Dimmer`, `Pan`, `Color Wheel`, `Gobo Wheel`, `Red`, and so on.
- **Geometry.** Each channel also carries `geometry`, the name of the geometry instance it drives.
- **Reused templates.** DMX channels on a geometry reached through `GeometryReference`s are
  repeated once per reference, at the reference's DMX offset, with the reference's name as
  `geometry`. So a 12-cell bar's mode lists 12 `Red` channels with `qaIndex` 0-11. This is
  the standard GDTF expansion.

The profile gains:
- **`geometry`**, a tree of nodes `{ name, kind, matrix, size, beam, children }`:
  - `kind` is one of `body`, `axis` or `beam`.
  - `matrix` is the 4×4 position and orientation from GDTF, which is in metres.
  - `size` comes from the referenced model's length, width and height.
  - `beam` is set on beam nodes: `{ beamAngle, fieldAngle, radius, type, flux, colorTemperature }`.
- **`gdtf`**: `{ fixtureTypeId, revision }`.
- **`physical`** in the OFL shape (`lens.degreesMinMax`, `bulb.colorTemperature`), taken from the
  first beam and the Zoom range, so existing readers keep working.
- **`wheels`** in the OFL shape: `{ slots: [{ type, name, colors, image }] }`. Colours are
  converted from CIE xyY to sRGB hex. `image` is the slot's media file name, if it has one.

`category` has no GDTF equivalent. The adapter derives it for display and for the OFL-only
renderer switch:
- `Moving Head` when the tree has a pan axis containing a tilt axis;
- `Pixel Bar` when it has more than one beam;
- `Color Changer` otherwise.

**Parsing.** Unzipping uses `fflate`: small, no dependencies, with async inflate. XML parsing
uses `xml2js`, which is already used for QLC showfiles. Parsing stays on the main thread: it runs
once per import and takes milliseconds for a `description.xml`, so the draft's worker idea is
dropped.

### 2. Local library in IndexedDB, plus a static bundle

`gdtf.store.js` (under `src/models/fixtures/`) is a thin IndexedDB wrapper.
- **Storage.** Database `asls-fixtures`, store `gdtf`, keyed by `fixtureTypeId`. A record is
  `{ fixtureTypeId, revision, manufacturer, name, file: Blob, importedAt }`.
- **Same everywhere.** Electron's renderer has IndexedDB too, so the browser and the desktop app
  behave the same. A disk folder in Electron can come later, without a format change.
- **Re-import.** Importing a file whose fixture type ID is already stored replaces the record,
  keeping the newer revision. The library keeps one revision per type.
- **Bundle.** The curated bundle is `public/fixtures/gdtf/` plus `gdtf_list.json`, listing for
  each file its name, manufacturer, fixture type ID and licence note. Bundled files are fetched
  through `VITE_STATIC_URL` when used, and never copied into IndexedDB.
- **Licences.** A file goes into the bundle only once the user confirms its redistribution terms
  (task 1.1). The bundle may start with zero files: the code path is the same.

`FixtureLibrary.getProfile('gdtf', manufacturer, fixtureTypeId)` loads the file from the local
library first, then from the bundle, unzips it, runs the adapter and freezes the result. Wheel
images are decoded at this point (decision 5) and kept with the profile as `ImageBitmap`s,
outside the frozen data. If neither source has the file, it rejects with a `MissingFixtureError`
that carries the fixture type ID and name.

`PROFILE_SOURCES` gains `GDTF: 'gdtf'`.

### 3. Showfile and missing fixtures

**Saving.** `Fixture.showData` already writes `source`, `manufacturer` and `model`. For GDTF,
`model` is the fixture type ID and `name` stays the display name. Nothing new is persisted, so
the save/load round trip and the unsaved marker are unchanged.

**Opening.** `Show.prepareFixtures` first resolves every distinct profile and collects the
`MissingFixtureError`s before it builds any fixture. If something is missing, the load pauses on
a "Missing fixtures" popup. The popup:
- lists each missing type (manufacturer and name);
- lets the operator import `.gdtf` files (each import re-checks the list);
- offers **Open anyway**.

**Open anyway.** The show opens without those fixtures. Their show data, and every reference to
them in groups and scenes, is kept aside unchanged and written back by `Show.showData`. So saving
without the fixtures does not lose them, and importing later and reopening brings them back. The
popup says so.

The kept-aside data is a plain array on `Show` (`unresolvedFixtures`). It holds no runtime state,
and `refreshSaveState` sees the same data as at load, so the show does not read as unsaved.

How group and scene references are kept: groups serialize fixture ids, and scenes store values
per fixture id, so a missing fixture's references are already plain ids in the raw show data.
On load:
- `Group` keeps any id it can't resolve in a raw `unresolved` list;
- `Group.showData` and `Scene.showData` merge those back in;
- the patch keeps the universe addresses reserved, so a new fixture can't be patched over a
  missing one.

That is the riskiest part of the unit. Task 2.4 checks it with a round trip.

### 4. Any category patches; the generic fixture

- **Patching.** The category throw in `Fixture.parseFromProfile()` goes.
- **Which class.** `FixtureRenderer.createInstance()` keeps `MovingHead` for OFL Moving Heads, so
  their look and the unit 4 benchmark stay the same. It builds a `GeometryFixture`
  (`geometry_fixture.js`) for everything else.
- **OFL fixtures.** A non-Moving-Head OFL fixture gets a synthetic tree with one body and one
  beam pointing down the body's −Z, sized from `physical.dimensions` (mm) or 0.3 m.
  GDTF Moving Heads use `GeometryFixture` too, since their tree has the axes.

`GeometryFixture` builds the tree once:
- **Nodes.** Each node is an `Object3D`. Body and axis nodes get a proxy box of `size`: one
  shared unit-box geometry scaled per node, in the fixture body material, on the OCCLUDER layer.
  Beam nodes get a lens disc.
- **Patch entry.** The renderer gets a geometry → channel index map built at patch time:
  - each profile channel is routed to the node named by its `geometry`;
  - channels with no `geometry`, or on the root, go to the root;
  - each beam reads a channel from itself or its nearest ancestor that has it. That is how
    GDTF works: a `Dimmer` on the root dims every cell that has no `Dimmer` of its own.

**Decoding.** It stays in `FixtureRenderer.decode`, extended to write into per-node state:
- axis nodes hold `pan` / `tilt` angles;
- beam nodes hold intensity, colour (additive mix, or wheel colour), gobo, zoom, focus, frost,
  prism, iris, strobe.

Each node's state is a preallocated object, so decoding doesn't allocate, and a node whose
inputs did not change is not re-decoded.

After decoding, `GeometryFixture.writeBeams()` writes one `BeamState` row per lit projector beam
(more with a prism, as `MovingHead` does).

**Glow-only beams.** GDTF beams of type `Glow`, `None` or `Rectangle` (LED pixels, effect cells,
panels) do not project light. They show as an emissive lens or cell in their colour and add a lens
glow, but write no beam row. That keeps a 20-bar pixel rig from becoming hundreds of projectors.
`Wash`, `Spot`, `PC`, `Fresnel` and `Beam` beams project as unit 3 and 4 beams.

Cost per frame:
- decoding is proportional to the channels that changed, as before;
- `writeBeams` is proportional to the lit beams;
- lighting cost grows with the beam count exactly as in units 3 and 4, and the governor already
  adapts to it;
- proxy bodies are a few boxes per fixture, with one draw per node. Per-type instancing comes
  with the real models in 5b.

### 5. Wheel images become gobo layers

- **Image format.** `gobos.js` keeps its procedural patterns as the first layers. A profile's
  wheel slots with an `image` are decoded once per type (`createImageBitmap` from the zip entry),
  drawn into 128×128 single-channel layers, then appended to the array. A layer is the image's
  luminance, inverted when the image is dark-on-light (GDTF gobo images are black where light
  passes, white where it is blocked, so this is checked on the border pixels). Mipmaps are
  rebuilt so that focus and frost blur still works.
- **Layer cap.** The array is rebuilt when a new type adds layers, with a cap of 64 layers in
  total. Past the cap, a slot falls back to `goboLayer(slots, i)`, the built-in pattern as today.
- **Lookup.** The renderer maps each wheel slot to its layer at patch time. The shaders don't
  change, since they already sample a layer index.

### 6. Patch UI

The universe patch popup lists its sources:
1. **Imported**: GDTF fixtures in the local library, from `gdtf.store.js`.
2. **Bundled**: the GDTF bundle.
3. **OFL library**: as today, grouped by manufacturer.

The popup also has an **Import GDTF…** button and accepts `.gdtf` files dropped on it. Each item
carries `source`, `manufacturer` and `model`, so `loadFixture` calls `FixtureLibrary.getProfile`
for all three the same way.

A failed import shows the reason through `app_error`, for example "not a GDTF file" or "no DMX
modes".

The group patch popup only lists fixtures that are already patched, so it doesn't change.

## Risks / Trade-offs

- **[GDTF files vary in quality]**: the adapter skips what it can't map (the `Unknown` attribute,
  or `Generic`), and a fixture with no usable mode is refused at import with a message. The task 3
  checks use several real files.
- **[Scene `type`/`qaIndex` stability]**: GDTF fixtures are new, so they have no saved scenes to
  break. The rule from now on: once released, the GDTF channel naming is frozen, like OFL's
  (the `fixture-library` skill says so).
- **[Kept-aside fixtures for missing types]**: subtle round trip. The spec covers it, and task 2.4
  checks it.
- **[IndexedDB is wiped with the site data]**: a show then asks for its fixtures again. That is
  what the missing-fixture popup is for. The manual says to keep the `.gdtf` files.
- **[Bundle licences]**: no file ships until the user confirms its terms.

## Migration Plan

None for data. OFL showfiles load unchanged. Rollback is a code revert: showfiles that reference
GDTF fixtures would then fail on an unknown source, the same failure as today for an unknown
fixture.

## Open Questions

- Which GDTF files go into the bundle (task 1.1, the user's choice).
