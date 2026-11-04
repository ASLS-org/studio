# Tasks

## 1. Generic GDTF bundle and test files

- [x] 1.1 Local test set: a few real `.gdtf` files you downloaded (a moving head with gobo images,
      a pixel bar, a multi-beam fixture), kept outside the repo and never committed.
      Verify: the files are outside the repo; `git status` shows none of them.
      Note (2026-11-04): the user supplied 202 files from 48 manufacturers in
      `~/Downloads/GDTF_fixtures_04_11_2026_19-_part_1`: GDTF 1.0 (70), 1.1 (24) and 1.2 (104),
      plus 4 with a zip CRC error. They include LED washes of up to 217 cells, a 400-cell LED
      wall, and 1313 wheel slot images (design.md decisions 1 and 5).
- [x] 1.2 `scripts/gdtf/generate-generic.mjs` writes the five generic fixtures of design.md
      decision 2 into `public/gdtf/` with `gdtf_list.json`. Their wheel PNGs are rendered from
      the `gobos.js` patterns, under CC0, with a `LICENSE` file.
      Verify: the script reproduces the same files when run twice; each file unzips to a
      `description.xml` that conforms to the GDTF 1.2 schema (`xmllint --schema`, using the
      schema from the GDTF spec).
      Note (2026-11-04): five files validate against `gdtf.xsd` from mvrdevelopment/tools; two
      runs give identical bytes. The gobo patterns moved to `gobo_patterns.js` (no Three.js) so
      the script can render them. `fflate` 0.8.2 added.

## 2. Engine: profiles, library, showfile (models)

- [x] 2.1 Move `deriveTypeKey`, `deriveAttribute` and the attribute tables out of `ofl.adapter.js`
      into a shared module, unchanged. Verify: with the demo show, the channel `type`, `qaIndex`
      and `attribute` of every patched fixture match a snapshot taken before the move (JSON diff
      in the page).
      Note (2026-11-04): moved to `channel.types.js`. Checked over the whole library instead of
      the demo only: a Node snapshot of every channel's name, type, qaIndex, attribute, colour and
      fine pairing for all 480 OFL fixtures is byte-identical before and after.
- [ ] 2.2 `gdtf.adapter.js` (pure, see design.md decision 1): modes, coarse and fine channels,
      functions mapped to OFL-shaped capabilities, geometry references expanded per instance,
      geometry tree, `physical`, `wheels`, derived category. Add `fflate` and the
      `PROFILE_SOURCES.GDTF` source. Verify: in Node, the adapter runs on the generic bundle and
      on all 198 readable test files without errors. The 4 damaged files are rejected with a
      message naming them. Unmapped attributes are counted, and the most common ones are
      reviewed (blades, animation wheel and mode attributes are expected). For the pixel bar, the mode lists one set of colour channels per cell; for
      the moving head, Pan and Tilt have fine channels and the angle ranges match the file.
- [ ] 2.3 OFL adapter expands `matrixChannels` insert blocks per pixel (`repeatFor`,
      `channelOrder`, `$pixelKey` names, `geometry` = pixel key). On load, report fixtures whose
      footprint grew (design.md decision 4). Verify: spec "OFL pixel bar footprint" and "Footprint
      grew in an older show" hold. The `type` / `qaIndex` snapshot from 2.1 is unchanged for
      every library fixture without insert blocks (Node script over `public/fixtures`).
- [ ] 2.4 `gdtf.store.js` (IndexedDB) and the bundle list. `FixtureLibrary.getProfile('gdtf',
      ...)` looks in the library, then the bundle, and rejects with `MissingFixtureError`; wheel
      images are decoded per type. Verify: in the page, importing the same file twice keeps one
      record; `getProfile` for an unknown ID rejects with that error.
- [ ] 2.5 `Show.prepareFixtures` resolves profiles first. It handles missing GDTF types (the
      popup hook, and Open anyway), and keeps their fixture, group and scene data aside and
      written back unchanged. The patch keeps their addresses reserved. `Fixture.parseFromProfile`
      no longer refuses categories other than Moving Head (design.md decision 3). Verify: spec
      "Open without, then restore", "Address stays reserved" and "Not marked unsaved" hold. An
      OFL-only showfile saved before the change re-saves byte-identical (except `version`).

## 3. UI (views)

- [ ] 3.1 Universe patch popup: Imported, Bundled and OFL library sections; an **Import GDTF…**
      button; `.gdtf` file drop; import errors through `app_error` (skill `vue-ui-change`).
      Verify: spec "Import a fixture", "Library survives a reload", "Invalid file" and "Patch a
      bundled fixture" hold in `npm start`.
- [ ] 3.2 Missing fixtures popup at show open: lists the missing types, imports files, and offers
      Open anyway with a note that their data is kept. Verify: spec "Import the missing fixture"
      holds after clearing IndexedDB and reopening a saved GDTF show.
- [ ] 3.3 With GDTF fixtures, scenes, effects and faders. Verify: spec "Dimmer and position",
      "Fine channel" and "Pixel bar cells" hold (output checked in the universe view).

## 4. Visualizer

- [ ] 4.1 `fixture_shapes.js`: parametric body shapes by role from GDTF trees, and synthetic
      OFL trees from category, dimensions, axes, beam and matrix cells (design.md decisions 4
      and 5). Verify: a page script builds and renders one fixture per OFL category plus each
      generic GDTF fixture, and the screenshot shows each one recognisably (yoke and head, can,
      bar, panel).
- [ ] 4.2 `geometry_fixture.js`: node tree with generated shapes on the OCCLUDER layer, axis
      rotation from Pan/Tilt, per-node decoding with inheritance from ancestors, and `writeBeams`
      for projector clusters (at most 8 per fixture); every cell is an instanced lit disc. OFL Moving Heads
      without pixel blocks keep `MovingHead`. Verify: spec "OFL PAR", "OFL pixel bar", "GDTF
      moving head", "Beam colours", "LED wash" and "Pixel cells" hold at every quality level. The demo show
      looks as before (screenshot against the epic branch).
- [ ] 4.3 Gobo array grows with wheel images, up to 64 layers, and falls back to the built-in
      patterns past that; slots map to layers at patch time (design.md decision 6). Verify: spec
      "Real gobo" holds on the floor at Medium and in the haze at High; focus and frost still
      blur it.
- [ ] 4.4 Frame cost check: a rig of 20 pixel bars and 10 Robin 600 LEDWash plus the demo rig
      plays a chase. Verify: with
      render on demand, a still show draws 0 frames over 3 s, and Auto quality does not step down
      on the M1 at High (Stats panel).

## 5. Docs and context

- [ ] 5.1 Manual (skill `user-manual`):
  - patching pages: importing GDTF, the Imported and Bundled lists, the missing fixtures popup,
    and keeping your `.gdtf` files;
  - visualizer page: remove the "moving heads only" note.

  Verify: the pages read correctly as Markdown (the manual dev server is broken since unit 2).
- [ ] 5.2 AI context (skill `ai-context-maintenance`):
  - `src/models/DMX/CLAUDE.md`: GDTF adapter, store, missing fixtures;
  - `src/plugins/visualizer/CLAUDE.md`: `GeometryFixture` and gobo layers from images; drop the
    Moving Head-only rule;
  - root `CLAUDE.md` Known traps: drop the Moving Head-only trap;
  - skill `fixture-library`: the generic GDTF bundle and its generator, the no-third-party-files
    rule, and frozen GDTF and OFL pixel channel naming.

  Verify: the files describe the new modules.
- [ ] 5.3 `npx eslint` on all touched files is clean.
