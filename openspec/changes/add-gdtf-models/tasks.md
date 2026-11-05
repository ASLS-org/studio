# Tasks

## 1. Fixtures: mesh files and triangle counts (models/fixtures)

- [x] 1.1 `gdtf.archive.js`: keep every detail folder per model file (`gltf_low`, `gltf`,
      `gltf_high`, `3ds_low`, `3ds`, `3ds_high`), while `modelCenter` keeps reading the standard
      glTF, then the 3DS (design decision 1). Verify with the Node harness over both GDTF test
      sets:
      - every model reads as before (same body offsets for all 757 modes);
      - 28 files report `gltf_high`.
- [x] 1.2 `gdtf.meshes.js`: pure triangle counts (glTF from its JSON chunk, 3DS from its face
      chunks) for meshes that pass `plausible`. The adapter adds `file` and `meshes` to each
      geometry node. Verify in Node:
      - the counts match the survey (glTF median about 1k per fixture, 3DS max about 114k);
      - the sweep lists how many meshes fail `plausible`;
      - no error over all modes.
      Measured: 1517 modes, no error.
      - 906 models have a mesh file, and 717 of them are usable.
      - Usable meshes per folder: glTF 353, high-detail glTF 82, 3DS 360.
      - Per fixture, glTF has a median of 957 triangles; 3DS has a median of 1.7k and a maximum
        of 248k.
      Most rejections were meshes that hang off their origin, a yoke below its base for example.
      A drawn mesh therefore keeps its own centre, up to 1.5 sizes away. Generated bodies keep
      the 5a rule, so all their offsets are unchanged.
- [x] 1.3 `FixtureLibrary.modelFiles(profile)` (side map filled by `buildGDTFProfile`, empty for
      OFL), and `Show.patchSnapshot` gains `models` and `type` (design decision 3). Verify in
      Node:
      - a patched imported GDTF entry carries its files;
      - OFL and bundled GDTF entries carry an empty map;
      - `Show.showData` is byte-identical before and after on the demo show.
      Checked in Node through `FixtureLibrary.importGDTF` with an in-memory IndexedDB:
      - Robe DL4S: 3 glTF files;
      - Toshiba BRGL: 3 3DS files;
      - bundled Generic Spot and Pixel Bar: none;
      - profiles still frozen.
      `showData` is checked by inspection: the snapshot is not part of it and no saved field was
      added.

## 2. Visualizer: detail rule, mesh loading, pools (plugins/visualizer)

- [x] 2.1 `fixture_shapes.js` `modelDetail(tree, level)`: detail order and triangle budget per
      level, one detail per fixture type, `null` when nothing fits (design decision 2). Verify in
      Node over both test sets:
      - the share of fixtures drawn with meshes at each level;
      - a 20k-triangle 3DS fixture gets `null` at Low and its meshes at Medium;
      - a fixture with `gltf` and `gltf_high` gets `gltf_high` at High only.
      Measured on 408 fixtures, 263 of them with usable meshes:
      - Guides and Low draw 227 with meshes;
      - Medium draws 253;
      - High draws 259, 28 of them at high detail (the Ayrton range).
      The ACME XP-1000SZ (3DS) gets generated parts at Low and its meshes from Medium.
- [x] 2.2 `fixture_models.js`: parse glTF (`GLTFLoader.parseAsync`) and 3DS (`TDSLoader.parse`)
      into one unit-box geometry per (type, file, detail), in GDTF axes, cached, with null on
      error and one console warning (design decision 4). Verify in Node, with the DOM stubs:
      - every plausible mesh of both test sets parses;
      - each result fills the unit box;
      - its centre over its size matches `modelCenter`.
      Measured: all 795 usable meshes parse and each fills the unit box. Only 2 centres differ
      from the import-time measure, by 0.04. The slowest parse is 149 ms, for a 248k-triangle 3DS
      mesh that is over every budget.
      3DS texture maps are skipped (`MeshTDSLoader`), so no stray texture requests are made.
- [x] 2.3 Model pools in `geometry_fixture.js`: keyed `type|file|detail`, 16 slots doubling,
      highlight resized, disposed when empty; shape pools unchanged (design decision 5). Verify
      in Node:
      - patching 40 copies of one modelled fixture uses one pool per mesh, grown to 64 slots;
      - removing them all disposes those pools and leaves the shape pools as they were.
      Passed: 40 Robe DL4S use 3 mesh pools at 64 slots; removing them disposes all 3.
- [x] 2.4 Piece swap: `GeometryFixture.setModelLevel(level)`, `FixtureRenderer.setModelLevel`,
      called from `Visualizer.applyQuality()`. Fixtures start with generated parts and swap when
      their geometry resolves; a removed fixture or a stale level ignores the result (design
      decision 6). Verify in Node:
      - a patch then an immediate unpatch leaves no slot taken;
      - Medium → High → Medium swaps, then returns to the same pools;
      - highlight state survives a swap.
      Passed. The Ayrton Bora swaps Medium → High → Medium and returns to the same meshes; level
      null brings back the generated parts. The first quality apply runs before the renderer
      exists, so `main()` passes the current level to it.
- [x] 2.5 Regression sweep in Node:
      - every mode of both GDTF test sets, the bundled GDTF and the OFL library draws at the
        four levels with no error;
      - OFL fixtures and bundled GDTF fixtures use exactly the shape pools they use today;
      - no allocation in `update(t)` after the swap (heap stable over 3600 frames on a 40-fixture
        rig).
      Passed. GDTF: 1517 modes, 0 errors, 1161 drawn with meshes at High, no mesh pool left.
      OFL: 2240 modes, 0 errors, all on the shape pools. Rig of 40 DL4S at Medium: heap −176 KB
      over 3600 frames.

## 3. In-app check (user)

- [ ] 3.1 Ask the user to run `npm start` and check, without me opening a browser:
      - import a GDTF file with glTF meshes (any of the test-set files holding `models/gltf`) and
        one with 3DS only; patch both;
      - the bodies show the manufacturer's parts, and pan/tilt, beams and the selection outline
        behave as before;
      - switch Low ↔ Medium ↔ High during playback: the meshes swap with no pause;
      - the demo show and an OFL rig look exactly as before;
      - save: no `*` from mesh loading, and the showfile is unchanged.
      Fix what the user reports before going on.

## 4. Docs and AI context

- [x] 4.1 User manual, visualizer page: fixture bodies from the imported file's meshes, what each
      quality level shows, and that meshes stay on the device (skill `user-manual`). Verify with
      `npm run docs:manual:build`: it builds with no dead link.
- [x] 4.2 AI context: in `src/plugins/visualizer/CLAUDE.md`, the `fixture_models.js` row, the
      model pools and model detail per level; in `src/models/DMX/CLAUDE.md`, the
      `FixtureLibrary.modelFiles` side map; in `.claude/skills/fixture-library/SKILL.md`, mesh
      folders and the plausibility rule (skill `ai-context-maintenance`). Verify that every path
      and symbol mentioned exists (`grep -rn`).
- [ ] 4.3 Epic status table: 5b refining → applying → archived, and decisions recorded. Verify
      that `openspec validate add-gdtf-models` passes.

## 5. Lint

- [x] 5.1 `npx eslint` on all touched files is clean. 0 errors; the 2 warnings are existing
      `console` calls in `show.model.js`.
