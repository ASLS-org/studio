# Design

Refined in the unit branch on 2026-11-04. Product decisions from the user:
- **Bundle.** It holds only generic GDTF fixtures written for the project. Files from GDTF Share
  and manufacturers stay out: the format is open, but each file's meshes, gobo images and
  thumbnails are copyrighted by default, and the Share terms are a contract. Fixtures come
  from the operator's own imports.
- **Library.** Showfiles reference a local library.
- **Bodies.** Every fixture's body is generated from its facts (category, dimensions, lens, cell
  layout), which carry no licence issue. OFL pixel fixtures render per cell.
- **Models.** glTF models move to unit 5b (`add-gdtf-models`).

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
- Every OFL fixture patches and renders with a body generated from its facts; OFL pixel
  fixtures render per cell.
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
- **`geometry`** on each mode (see "One tree per mode" below), a tree of nodes `{ name, kind, matrix, size, beam, children }`:
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

**Versions and broken files.** The local test set mixes GDTF 1.0 (70 files), 1.1 (24) and 1.2
(104), so the adapter reads all three. The differences that matter:
- DMX values are written as `N` or `N/bytes`;
- in 1.0, the channel's geometry and default value can sit on different elements;
- `Break` offsets differ.

Four of the files fail the zip CRC check, but their content is complete and well formed (only the
stored checksum is wrong). They import. A file counts as damaged, and is rejected with a message,
when it doesn't unzip, has no `description.xml`, or its XML doesn't parse.

Found while building the adapter (2026-11-04):
- **Virtual channels.** Channels with an empty `Offset` have no DMX address and are skipped. A
  cell whose only dimmer is virtual is lit by its colour channels.
- **Functions without an attribute.** These take their logical channel's attribute;
  `NoFeature` functions become `NoFunction`.
- **Root geometry.** In some 1.0 files a mode names a nested geometry, or none at all. The
  adapter then searches the whole tree, then falls back to the first top-level geometry.
- **One tree per mode.** Modes can have different root geometries (one zone or twelve, for
  example), so the geometry tree lives on each mode (`mode.geometry`), not on the profile.
- **Unit parsing fix.** `Entity.parseValueUnit` read `-12.5deg` as the unit `-.deg`, which
  scaled the value by 1000. It now strips the signed decimal number. That bug already hit 511
  values in the OFL library (strobe rates such as `33.3Hz`, angles such as `12.8deg`). Those now
  decode correctly. Saved scenes are unaffected, since they store DMX values.

### 2. Local library in IndexedDB, plus a static bundle

`gdtf.store.js` (under `src/models/fixtures/`) is a thin IndexedDB wrapper.
- **Storage.** Database `asls-fixtures`, store `gdtf`, keyed by `fixtureTypeId`. A record is
  `{ fixtureTypeId, revision, manufacturer, name, file: Blob, importedAt }`.
- **Same everywhere.** Electron's renderer has IndexedDB too, so the browser and the desktop app
  behave the same. A disk folder in Electron can come later, without a format change.
- **Re-import.** Importing a file whose fixture type ID is already stored replaces the record,
  keeping the newer revision. The library keeps one revision per type.
- **Bundle.** It lives in `public/gdtf/` with a `gdtf_list.json` index, kept out of
  `public/fixtures/`, which is the vendored OFL snapshot. Bundled files are fetched through
  `VITE_STATIC_URL` when used, and never copied into IndexedDB.
- **Generic fixtures.** A Node script, `scripts/gdtf/generate-generic.mjs`, writes the bundle
  from code (the `description.xml` plus wheel PNGs rendered from the `gobos.js` patterns), so the
  files are reproducible and wholly the project's own. The manufacturer is "ASLS Generic":

  | Fixture | Exercises |
  |---|---|
  | Generic PAR RGBW | 8-bit dimmer, additive colour, strobe |
  | Generic Spot | 16-bit pan/tilt, colour wheel, rotating gobo wheel with images, zoom, focus, frost, prism |
  | Generic Wash RGBW | Moving head, zoom, colour mixing |
  | Generic Pixel Bar 12 | 12 glowing RGB cells from one geometry reference, master dimmer |
  | Generic Beam Bar 4 | 4 tilting projector beams, each with its own dimmer and colour |

  They double as the committed test set. Real third-party files are tested only locally (task
  1.1).

`FixtureLibrary.getProfile('gdtf', manufacturer, fixtureTypeId)` loads the file from the local
library first, then from the bundle, unzips it, runs the adapter and freezes the result. Wheel
images are decoded at this point (decision 6) and kept with the profile as `ImageBitmap`s,
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

### 4. OFL pixel channels expand per cell

OFL `matrix` fixtures (93 in the library) declare cells (`pixelCount` or `pixelKeys`, optionally
grouped) and `templateChannels` whose names contain `$pixelKey`. Their modes insert them with
`{ insert: "matrixChannels", repeatFor, channelOrder, templateChannels }`. Today
`buildMode` turns each insert block into one `Unset` slot.

The OFL adapter now expands each block as OFL defines it:
- **Order.** `repeatFor` is a list of keys, or `eachPixelABC`, `eachPixelXYZ`, and so on.
  `channelOrder` is `perPixel` or `perChannel`.
- **Channels.** Each expanded channel is named with the pixel key substituted (`Red 3`). Its
  type comes from `deriveTypeKey`, as for any channel, and it carries `geometry` = the pixel key.

The profile also gets a synthetic geometry tree (decision 5) with one beam per pixel, laid out on
the matrix grid. The cell spacing comes from `physical.matrixPixels` when it's given, and
otherwise the cells are spread evenly over the body face.

Compatibility: only fixtures with insert blocks change. Two cases:
- **Not Moving Heads.** They could never be patched, so no showfile has them.
- **About 14 OFL Moving Heads** (for example Robin LEDWash 600, Rogue R2 Wash) could be patched,
  but each block became one `Unset` slot. Their DMX footprint was shorter than the real fixture,
  and the addressing was wrong.

  Expanding fixes the footprint, but channels after the block shift. A saved show with one of
  them may then overlap the next fixture's addresses, and its scene values move to other channels.

  On load, such a fixture is detected (its saved patch length differs from the expanded one) and
  reported once through `app_error` with its name. It is left patched with its new footprint. The
  operator re-addresses it if it overlaps.

### 5. Any category patches; generated bodies

- **Patching.** The category throw in `Fixture.parseFromProfile()` goes.
- **Which class.** `FixtureRenderer.createInstance()` keeps `MovingHead` for OFL Moving Heads
  without pixel blocks, so their look and the unit 4 benchmark stay the same. It builds a
  `GeometryFixture` (`geometry_fixture.js`) for everything else.

Every geometry tree gets its body shapes from `fixture_shapes.js`, a pure module that turns facts
into node shapes:
- **GDTF trees.** Each node already has its place and `size`. The shape generator gives it a
  shape by role: base, yoke, head, can, bar or cell. The role comes from its kind, its position in
  the tree and its aspect ratio.
- **OFL trees.** They are synthesised from:
  - the category: Moving Head and Scanner get base, yoke and head; Color Changer and Dimmer get a
    can; Pixel Bar and Matrix get a bar or panel; anything else a box;
  - `physical.dimensions` (mm, default 0.3 m);
  - the pan/tilt axes, when the fixture has Pan/Tilt channels;
  - one beam on the head's front, or the matrix cells (decision 4).
- **Shapes.** They are parametric: rounded boxes, cylinders and a lens ring, from a few shared
  geometries scaled per node. They come out the same for the same input. In 5b they stay as the
  fallback for GDTF files without models, and at the Guides and Low levels.

`GeometryFixture` builds the tree once:
- **Nodes.** Each node is an `Object3D` with its generated shape in the fixture body material, on
  the OCCLUDER layer. Beam nodes get a lens disc.
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

**Cells and projectors.** The local test set has 198 readable files. In it, a beam's type says
nothing about its role:
- LED washes are many `Wash` cells forming one beam: 37 on a Robin 600 LEDWash, 217 on a WildSun
  K25.
- Pixel strips and LED walls mostly use `None`, the largest with 400 cells.

So the view keeps two things apart:
- **Cells.** Every beam node shows as a lit cell (an emissive disc in its colour, plus a lens
  glow). All cells of the visible fixtures go into one instanced draw.
- **Projectors.** Projected light (`BeamState` rows: floor light and air beams) comes from
  clusters of cells. Rules:
  - `None`, `Glow` and `Rectangle` cells project nothing.
  - The other cells are grouped when they share a parent and point within 5° of each other.
  - A group spanning more than 0.4 m is split along its long side into equal parts. A fixture
    has at most `MAX_PROJECTORS` (8) projectors in all.
  - A cluster's projector starts at the cells' centroid, with their mean field angle and gobo.
    Its intensity is the sum of the cells' intensities; its colour is the intensity-weighted mix.

Some examples:
- A Robin LEDWash projects one beam, its cells lit individually on the lens.
- A 1 m pixel bar projects 3 beams.
- A Tarantula (6 tilting bars) projects up to 8.
- A spot has one cell, so one projector, as before.

So a rig's lighting cost is bounded by its fixture count, not its cell count. Cell colours change
on the lens at full detail.

Cost per frame:
- decoding is proportional to the channels that changed, as before;
- `writeBeams` is proportional to the lit beams;
- lighting cost grows with the beam count exactly as in units 3 and 4, and the governor already
  adapts to it;
- generated bodies are a few shapes per fixture, with one draw per node. Per-type instancing
  comes with 5b.

### 6. Wheel images become gobo layers

- **Image format.** `gobos.js` keeps its procedural patterns as the first layers. A profile's
  wheel slots with an `image` are decoded once per type (`createImageBitmap` from the zip entry),
  drawn into 128×128 single-channel layers, then appended to the array. A layer is the image's
  luminance. GDTF gobo images are white where light passes and black outside, as in the test
  set. A file drawn the other way round is detected on its border pixels (bright border) and
  inverted. Mipmaps are
  rebuilt so that focus and frost blur still works.
- **Layer cap.** The array is rebuilt when a new type adds layers, with a cap of 64 layers in
  total. Past the cap, a slot falls back to `goboLayer(slots, i)`, the built-in pattern as today.
- **Lookup.** The renderer maps each wheel slot to its layer at patch time. The shaders don't
  change, since they already sample a layer index.

### 7. Patch UI

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
- **[Licences]**: the bundle holds only generated files. Bodies and gobos come from facts or
  from our own patterns, never from third-party meshes or images. Third-party files reach the
  app only through the operator's own import.
- **[OFL Moving Heads with pixel blocks]**: saved shows using them shift (decision 4), reported
  on load.

## Migration Plan

None for data. OFL showfiles load unchanged. Rollback is a code revert: showfiles that reference
GDTF fixtures would then fail on an unknown source, the same failure as today for an unknown
fixture.

## Open Questions

None. The generated bundle files are CC0 (the user's choice, 2026-11-04). `public/gdtf/` holds a
`LICENSE` file with the CC0 text, and `gdtf_list.json` records the licence.
