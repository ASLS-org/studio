# Tasks

## 1. Test files and bundle

- [ ] 1.1 Gather test `.gdtf` files and choose the bundle (user's call):
  - **Test set:** at least a moving head with gobo images, an RGB pixel bar with glowing cells,
    and a multi-beam fixture.
  - **Bundle:** the user names the files whose redistribution terms allow shipping. Test files
    stay in the scratchpad, never in the repo.

  Verify: the user has confirmed the list; each bundled file has a licence note for
  `gdtf_list.json`.

## 2. Engine: profiles, library, showfile (models)

- [ ] 2.1 Move `deriveTypeKey`, `deriveAttribute` and the attribute tables out of `ofl.adapter.js`
      into a shared module, unchanged. Verify: with the demo show, the channel `type`, `qaIndex`
      and `attribute` of every patched fixture match a snapshot taken before the move (JSON diff
      in the page).
- [ ] 2.2 `gdtf.adapter.js` (pure, see design.md decision 1): modes, coarse and fine channels,
      functions mapped to OFL-shaped capabilities, geometry references expanded per instance,
      geometry tree, `physical`, `wheels`, derived category. Add `fflate` and the
      `PROFILE_SOURCES.GDTF` source. Verify: in Node, the adapter runs on every test file
      without errors. For the pixel bar, the mode lists one set of colour channels per cell; for
      the moving head, Pan and Tilt have fine channels and the angle ranges match the file.
- [ ] 2.3 `gdtf.store.js` (IndexedDB) and the bundle list. `FixtureLibrary.getProfile('gdtf',
      ...)` looks in the library, then the bundle, and rejects with `MissingFixtureError`; wheel
      images are decoded per type. Verify: in the page, importing the same file twice keeps one
      record; `getProfile` for an unknown ID rejects with that error.
- [ ] 2.4 `Show.prepareFixtures` resolves profiles first. It handles missing GDTF types (the
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

- [ ] 4.1 `geometry_fixture.js`: node tree with proxy boxes on the OCCLUDER layer, axis rotation
      from Pan/Tilt, per-node decoding with inheritance from ancestors, and `writeBeams` for
      projecting beams; glow-only cells are emissive and add a lens glow. Build it for GDTF
      fixtures and for non-Moving-Head OFL fixtures (a synthetic tree); OFL Moving Heads keep
      `MovingHead` (design.md decision 4). Verify: spec "OFL PAR", "GDTF moving head", "Beam
      colours" and "Pixel cells" hold at every quality level. The demo show looks as before
      (screenshot against the epic branch).
- [ ] 4.2 Gobo array grows with wheel images, up to 64 layers, and falls back to the built-in
      patterns past that; slots map to layers at patch time (design.md decision 5). Verify: spec
      "Real gobo" holds on the floor at Medium and in the haze at High; focus and frost still
      blur it.
- [ ] 4.3 Frame cost check: a rig of 20 pixel bars plus the demo rig plays a chase. Verify: with
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
  - skill `fixture-library`: GDTF bundle, and frozen GDTF channel naming.

  Verify: the files describe the new modules.
- [ ] 5.3 `npx eslint` on all touched files is clean.
