# Design

See proposal.md for why. This unit touches the fixture layer (archive, adapter, library), the show's
patch snapshot and the visualizer. It changes no showfile data, no timing and no output.

## Context

- `gdtf.archive.js` already reads `models/<folder>/<file>.glb|.3ds`, but keeps one GLB per model
  file (standard glTF folder preferred) plus the 3DS bytes. They are used only to place generated
  bodies (`gdtf.meshes.js` `modelCenter`, with a `plausible` check against the model's size).
- Each geometry node of a GDTF profile carries `size`, `offset` and `shape` (primitive). It does
  not carry the model's file name.
- `GeometryFixture` draws each body piece in a `ShapePool`: one `InstancedMesh` per body shape for
  the whole rig, created on first use with `POOL_CAPACITY` 4096 slots and never disposed. It uses
  one white `MeshPhongMaterial`, the OCCLUDER layer and an `InstanceHighlight`.
- Wheel images go to the visualizer the way meshes will: a side map in `FixtureLibrary`
  (`wheelImages(profile)`), which keeps the frozen profile pure, read by `Show.patchSnapshot`.
- `Visualizer.applyQuality()` resolves the level (by hand, or the governor's on Auto) and sets
  `lighting.level`. Nothing else follows the level yet.

Measured on 408 test files (two GDTF Share exports and the bundle, 2026-11-05):
- Models: 1756 in all.
  - 844 have no file (primitive only).
  - 391 have a GLB.
  - 509 have 3DS only.
  - 12 name a file the archive lacks.
- Fixtures: 148 of 408 hold 3DS only.
- Detail levels: none holds `gltf_low`; 28 hold `gltf_high`.
- Format: no Draco and no textures. Every material is PBR.
- Triangles per fixture:

  | Meshes | Median | 95th percentile | Max |
  |---|---|---|---|
  | glTF | 958 | 1.8k | 13k |
  | glTF high | 2.2k | 11k | |
  | 3DS | 1.7k | 22.5k | 114k |

## Goals / Non-Goals

**Goals**
- Draw each part with its own mesh, converted to GDTF axes and to the part's model box, with
  every part placed exactly as the generated part is today. Axes, beams, cells and highlight are
  unchanged.
- One draw per (fixture type, mesh, detail) for the whole rig.
- Choose the detail with pure, Node-testable rules, from triangle counts read at import.

**Non-Goals**
- The meshes' own materials and colours: every body keeps the single body material, so lighting
  and the highlight look the same on every fixture (see Risks).
- Decimation, MVR, a whole-rig triangle budget.
- OFL fixtures and the bundled generic GDTF fixtures, which have no meshes.

## Decisions

### 1. The archive keeps every detail level, the profile records triangle counts

- `readGDTF` returns `models: Map<file, {gltf_low, gltf, gltf_high, threeDs_low, threeDs,
  threeDs_high}>` (bytes; only the folders present). The folder pattern becomes
  `(gltf|3ds)(_low|_high)?`.
- `modelCenter` keeps reading the standard glTF, then the 3DS, as now.
- The adapter adds two fields to each node from its model:
  - `file`, the model's File name;
  - `meshes`, the triangles per detail and format, for meshes that pass `plausible`, e.g.
    `{ gltf: 412, threeDs: 380 }`.
- Counting is pure, in `gdtf.meshes.js`:
  - glTF: index or vertex counts from the JSON chunk;
  - 3DS: face counts from the chunk walk it already does.
- Alternative: count in the visualizer after parsing. Rejected: choosing a detail would then mean
  parsing every detail first, including 100k-triangle 3DS files, only to reject them.

### 2. The detail rule is pure and chosen per fixture type

`fixture_shapes.js` (pure) gets `modelDetail(tree, level)`:

| Level | Detail order | Triangle budget |
|---|---|---|
| Guides, Low | low, standard, high | 5,000 |
| Medium | standard, low, high | 30,000 |
| High | high, standard, low | 150,000 |

- For each detail in order, glTF before 3DS, the fixture's total is the sum over its nodes that
  have a mesh at that detail.
- The first detail whose total fits the budget wins. None fits → `null` (generated parts).
- Nodes without a mesh at the chosen detail keep their generated part.
- One detail per fixture type: a head never shows high detail on a low detail yoke.
- Budgets come from the measurements above:
  - Low draws nearly every glTF and half the 3DS fixtures;
  - Medium draws 95% of the 3DS fixtures;
  - High draws all of them.
- The thresholds are constants, set again in the final pass if the smoke test asks.

### 3. Mesh files reach the visualizer through the patch snapshot

- `FixtureLibrary` keeps `modelFiles` next to `wheelImages` (WeakMap profile → models map), filled
  by `buildGDTFProfile`, with a static `modelFiles(profile)` that returns an empty Map for OFL
  profiles.
- `Show.patchSnapshot` adds `models` and `type` (the GDTF fixture type ID, else null).
- Bytes stay in memory only while their profile does, which is already the case for the `.gdtf`
  file. Nothing is written anywhere: no showfile key, no store change, no bundle change.

### 4. Meshes are parsed once per (type, file, detail), off the frame path

- A new visualizer module, `fixture_models.js`, holds `modelGeometry(type, file, detail, bytes)`,
  which returns a Promise of a unit-box `BufferGeometry` or null. It is cached by key.
- glTF goes through `GLTFLoader.parseAsync` (the same Draco decoder as `ModelInstancer`).
- 3DS goes through three's `TDSLoader.parse` (in three 0.170, no new dependency).
- Every mesh is baked:
  - world matrices applied;
  - glTF Y-up → GDTF Z-up as `(x, y, z) → (x, -z, y)` (the axes `glbCenter` measures, so the
    `plausible` check and the drawing agree);
  - only position and normal kept; normals computed when missing;
  - indices merged with `mergeGeometries`;
  - scaled into the unit box with the same `toUnitBox` as the generated shapes.
- The node keeps its `bodyMatrix(size, offset)`, so a mesh lands where the generated part was.
- A parse error resolves to null: that part keeps its generated body. It is reported once on the
  console as a warning, never as `app_error`, because a damaged mesh is not something the operator
  can fix in the show.

### 5. Pools per mesh, sized to need, disposed when empty

- `poolOf(key, geometry)` serves both kinds: shape pools (key = shape, as now) and model pools
  (key = `type|file|detail`).
- Model pools start at 16 slots and double when full:
  - a new `InstancedMesh` with the old matrices copied;
  - its highlight resized the same way.
- The 4096-slot pools stay for shapes only, so dozens of fixture types don't each hold 4096
  matrices.
- A model pool is removed from the scene and disposed when its last slot is released. Its
  geometry stays in the parse cache for the session, so a quality swap back is instant.

### 6. Pieces swap when the level or the geometry changes

- `GeometryFixture` keeps, per piece, the generated shape and the node's mesh data.
- `setModelLevel(level)` computes `modelDetail` once per fixture. Then, for each piece:
  - with a mesh at that detail: ask for the geometry; when it resolves, if the fixture still
    exists and the detail is still current, release the shape slot, take a model slot and copy
    the matrix and highlight state;
  - otherwise: go back to the shape slot.
- `FixtureRenderer.setModelLevel(level)` applies it to every instance and to new instances, and
  calls `onChange` (render on demand).
- `Visualizer.applyQuality()` calls it with the resolved level, so Auto swaps meshes along with
  the lighting.
- A fixture is created with its generated parts and swaps when its meshes resolve. Patch and
  first frame never wait on parsing.

### Per-frame cost

- None added. Pieces are re-placed in the existing `writeRow` / matrix path, one slot each as
  today.
- Parsing and swaps happen on patch and level changes only.
- Draw calls grow by one per (fixture type, mesh, detail) in use. A rig of 40 identical fixtures
  with three meshes adds three draws.

## Risks / Trade-offs

- **[Large 3DS parse stalls the main thread]** A 114k-triangle file takes tens of milliseconds
  once per session.
  → Parses run on patch or level change, never per frame. Above the High budget a mesh is never
  parsed. The visualizer-in-a-Worker unit (6) could take it later.
- **[Misoriented manufacturer meshes]** → Only meshes that pass the existing `plausible` check are
  used. The sweep reports how many fall back.
- **[One white material]** Manufacturer colours (black housings, coloured lenses) are not shown.
  → It keeps the lit look and the highlight uniform with the generated bodies. Base colour per
  mesh is a small follow-up if the final pass asks for it.
- **[Memory]** Up to three parsed details per fixture type at most.
  → A pool is released when empty; geometry is cached per session only.
- **[Auto flickers between levels]** It would swap meshes with the lighting.
  → The governor already rate-limits raises (`RAISE_BLOCK_MS`); swaps reuse the cached geometry.

## Migration Plan

- No data migration: showfiles, the GDTF store and the bundle are unchanged.
- Files imported before this change already hold their meshes, so they show them on the next open.
- Rollback: revert the unit; generated bodies come back.
