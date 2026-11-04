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
- [x] 2.2 `gdtf.adapter.js` (pure, see design.md decision 1): modes, coarse and fine channels,
      functions mapped to OFL-shaped capabilities, geometry references expanded per instance,
      geometry tree, `physical`, `wheels`, derived category. Add `fflate` and the
      `PROFILE_SOURCES.GDTF` source. Verify: in Node, the adapter runs on the generic bundle and
      on all 198 readable test files without errors. The 4 damaged files are rejected with a
      message naming them. Unmapped attributes are counted, and the most common ones are
      reviewed (blades, animation wheel and mode attributes are expected).
      Note (2026-11-04): `gdtf.archive.js` (unzip, XML) and `gdtf.adapter.js`. All 202 test
      files import, including the 4 with a wrong CRC but intact content (design.md decision 1).
      The categories come out as 100 Moving Head, 72 Color Changer and 30 Pixel Bar; the largest
      mode has 480 channels and 400 cells. The most common unmapped attributes are Control1,
      PositionMSpeed, ColorMacro1, Tint, DimmerMode, Blade*, AnimationWheel1 and ColorMixMode.
      The `Entity.parseValueUnit` fix is recorded in design.md. The OFL snapshot from 2.1 is
      unchanged. For the pixel bar, the mode lists one set of colour channels per cell; for
      the moving head, Pan and Tilt have fine channels and the angle ranges match the file.
- [x] 2.3 OFL adapter expands `matrixChannels` insert blocks per pixel (`repeatFor`,
      `channelOrder`, `$pixelKey` names, `geometry` = pixel key). On load, report fixtures whose
      footprint grew (design.md decision 4). Verify: spec "OFL pixel bar footprint" and "Footprint
      grew in an older show" hold. The `type` / `qaIndex` snapshot from 2.1 is unchanged for
      every library fixture without insert blocks (Node script over `public/fixtures`).
      Note (2026-11-04): direct template references keep `type` = their name (design.md decision
      4), so the check holds for all 405 fixtures without insert blocks. "OFL pixel bar footprint"
      was checked on the profile: the Eurolite LED PIX-144 24-channel mode has `Red 3` at channel
      7. It is checked again in the patch popup once task 2.5 lifts the category limit. "Footprint
      grew in an older show" was checked in the app: a Robin LEDWash 600 saved without
      `channelCount` opens with 37 channels and the message, and saves `channelCount: 37`; after a
      reload there is no message and the show is not marked unsaved. Fixtures now save
      `channelCount`.
- [x] 2.4 `gdtf.store.js` (IndexedDB) and the bundle list. `FixtureLibrary.getProfile('gdtf',
      ...)` looks in the library, then the bundle, and rejects with `MissingFixtureError`; wheel
      images are decoded per type. Verify: in the page, importing the same file twice keeps one
      record; `getProfile` for an unknown ID rejects with that error.
      Note (2026-11-04): checked in the page. Importing the generic spot twice leaves one record.
      An unknown ID rejects with `MissingFixtureError`. The bundled pixel bar loads without
      import (modes of 38 and 5 channels). The spot's 7 gobo images decode at 256 px
      (`FixtureLibrary.wheelImages`).
- [x] 2.5 `Show.prepareFixtures` resolves profiles first. It handles missing GDTF types (the
      popup hook, and Open anyway), and keeps their fixture, group and scene data aside and
      written back unchanged. The patch keeps their addresses reserved. `Fixture.parseFromProfile`
      no longer refuses categories other than Moving Head (design.md decision 3). Verify: spec
      "Open without, then restore", "Address stays reserved" and "Not marked unsaved" hold. An
      OFL-only showfile saved before the change re-saves identical except for the new
      `channelCount` keys.
      Note (2026-11-04): a fixture whose type is missing is kept as a placeholder (design.md
      decision 3, revised): the pool renumbers ids on load, so skipping fixtures would shift every
      later reference. The placeholder has the saved mode and `channelCount` empty channels, is
      left out of the 3D view, and its scene values are kept as saved. Checked in the page with a
      test-only GDTF copy deleted from IndexedDB: the show opens with a 16-channel placeholder,
      is not marked unsaved, keeps universe 1 addresses 21-36 reserved, and re-saves its
      fixtures, universes and groups identically. After re-importing and reopening, the fixture
      is back at its address, in its group, with the scene's Dimmer at 200. The OFL re-save check
      is by code: `channelCount` is the only persisted field this unit adds. The missing-fixtures
      popup hooks in through the `fixtures_missing` EventBus event (task 3.2); with no listener
      the show opens with placeholders.

## 3. UI (views)

- [x] 3.1 Universe patch popup: Imported, Bundled and OFL library sections; an **Import GDTF…**
      button; `.gdtf` file drop; import errors through `app_error` (skill `vue-ui-change`).
      Verify: spec "Import a fixture", "Library survives a reload", "Invalid file" and "Patch a
      bundled fixture" hold in `npm start`.
      Note (2026-11-04): checked in the running app (popup driven through the page):
      - a dropped `.gdtf` file appears under Imported, and a broken file shows an error naming it;
      - the Imported list survives a reload;
      - the bundled Generic Spot patches with its 16 channels;
      - an OFL PAR (`Color Changer`) patches with 7 channels;
      - the Eurolite LED PIX-144 24-channel mode patches with 24 channels and `Red 3` as its 7th
        channel (spec "OFL pixel bar footprint").

      The list shows the manufacturer as secondary text (screenshot `pp-list.png`).
- [x] 3.2 Missing fixtures popup at show open: lists the missing types, imports files, and offers
      Open anyway with a note that their data is kept. Verify: spec "Import the missing fixture"
      holds after clearing IndexedDB and reopening a saved GDTF show.
      Note (2026-11-04): `popup.missing.fixtures.vue`, mounted in the app shell, listens to
      `fixtures_missing`. Checked at boot with the test spot removed from IndexedDB:
      - the show waits with the popup listing the spot;
      - after a dropped file the button reads Open, and the show opens with the real fixture,
        not marked unsaved;
      - closing the popup from its header works like Open anyway (placeholder).

      Screenshot `mf-ask2.png`.
- [x] 3.3 With GDTF fixtures, scenes, effects and faders. Verify: spec "Dimmer and position",
      "Fine channel" and "Pixel bar cells" hold (output checked in the universe view).
      Note (2026-11-04): checked on universe 1's output frame:
      - a scene on the bundled spot and 12-cell bar puts 255 on the spot's Dimmer address, 128 on
        its Pan coarse, and 255 only on cell 3's Red;
      - a fader-style half value on the 16-bit Tilt gives coarse 127, fine 128;
      - a demo effect (Dimmer/Pan/Tilt/colour/Zoom) drives the bundled RGBW wash (10 different
        frames out of 10 samples).

## 4. Visualizer

- [x] 4.1 `fixture_shapes.js`: parametric body shapes by role from GDTF trees, and synthetic
      OFL trees from category, dimensions, axes, beam and matrix cells (design.md decisions 4
      and 5). Verify: a page script builds and renders one fixture per OFL category plus each
      generic GDTF fixture, and the screenshot shows each one recognisably (yoke and head, can,
      bar, panel).
- [x] 4.2 `geometry_fixture.js`: node tree with generated shapes on the OCCLUDER layer, axis
      rotation from Pan/Tilt, per-node decoding with inheritance from ancestors, and `writeBeams`
      for projector clusters (at most 8 per fixture); every cell is an instanced lit disc. OFL Moving Heads
      without pixel blocks keep `MovingHead`. Verify: spec "OFL PAR", "OFL pixel bar", "GDTF
      moving head", "Beam colours", "LED wash" and "Pixel cells" hold at every quality level. The demo show
      looks as before (screenshot against the epic branch).
      Note (2026-11-04): checked in the app on a test rig, every fixture hanging at 6 m:
      - **Fixtures:** the bundled spot, beam bar and pixel bar, the real Robin 600 LEDWash GDTF,
        an OFL PAR, the OFL LED PIX-144 and the OFL Robin LEDWash 600.
      - **Results:**
        - the spot casts its gobo and turns through −270°…270° with Pan;
        - the beam bar's heads are red, blue and green;
        - the pixel bar's cells glow with no beams;
        - the Robin GDTF's 37 cells make one wash;
        - the OFL PAR casts red;
        - only pixel 3 of the OFL bar is blue.
      - **Quality levels:** checked at High, Low and Guides (`gf-high.png`, `gf-low.png`,
        `gf-guides.png`).
      - **Bodies:** base, yoke and head, a can, bars (`gf-bodies*.png`).
      - **Demo show:** renders as before (`gf-demo.png`); the only `MovingHead` change moves
        `BeamState.begin`/`end` to the visualizer.
- [x] 4.3 Gobo array grows with wheel images, up to 64 layers, and falls back to the built-in
      patterns past that; slots map to layers at patch time (design.md decision 6). Verify: spec
      "Real gobo" holds on the floor at Medium and in the haze at High; focus and frost still
      blur it.
      Note (2026-11-04): checked with the real Ayrton Diablo GDTF. Its "Infinite stairs" slot
      uses image layer 13 (the texture grows from 10 to 19 layers); it shows on the floor at
      Medium and in the haze at High, and full frost blurs it (`gobo-*.png`). Fixed in the
      adapter on the way: prism wheels (Prism1 with Open / facet slots) now decode as wheel
      slots, so DMX 0 takes the prism out; before, the whole channel read as "prism in".
- [x] 4.4 Frame cost check: a rig of 20 pixel bars and 10 Robin 600 LEDWash plus the demo rig
      plays a chase. Verify: with
      render on demand, a still show draws 0 frames over 3 s, and Auto quality does not step down
      on the M1 at High (Stats panel).
      Note (2026-11-04): checked in headless Chrome on the M1, measured in the page rather than
      with the Stats panel.
      - **Rig:** the demo rig plus 20 Generic Pixel Bars and 10 real Robin 600 LEDWash GDTFs,
        all lit (266 beam rows).
      - **Still:** with playback stopped, the visualizer drew 0 frames over 3 s.
      - **Playing:** with the demo chase and an effect on Auto, about 52 frames per second at
        2.1 ms of draw time per frame. Quality stayed at High, full resolution, 16 samples, for
        12 s.

## 5. Docs and context

- [x] 5.1 Manual (skill `user-manual`):
  - patching pages: importing GDTF, the Imported and Bundled lists, the missing fixtures popup,
    and keeping your `.gdtf` files;
  - visualizer page: remove the "moving heads only" note.

  Verify: the pages read correctly as Markdown (the manual dev server is broken since unit 2).
  Note (2026-11-04): `workflow/patching/index.md` written (it was "in progress"): sources,
  GDTF import, the device library, missing fixtures, pixel fixtures. The visualizer page drops
  the moving-heads-only note and mentions GDTF gobos; the universe page's Wheel Slot row
  covers gobo and prism wheels. Two `TODO media` placeholders on the patching page. Checked as
  Markdown.
- [x] 5.2 AI context (skill `ai-context-maintenance`):
  - `src/models/DMX/CLAUDE.md`: GDTF adapter, store, missing fixtures;
  - `src/plugins/visualizer/CLAUDE.md`: `GeometryFixture` and gobo layers from images; drop the
    Moving Head-only rule;
  - root `CLAUDE.md` Known traps: drop the Moving Head-only trap;
  - skill `fixture-library`: the generic GDTF bundle and its generator, the no-third-party-files
    rule, and frozen GDTF and OFL pixel channel naming.

  Verify: the files describe the new modules.
  Note (2026-11-04): also a root Known trap for running `src/` modules in Node (esbuild
  bundle), the `public/gdtf/*` generated-output rule, and the pool-renumbering invariant in
  `src/models/DMX/CLAUDE.md`. Every path and symbol mentioned was checked to exist.
- [x] 5.3 `npx eslint` on all touched files is clean.
      Note (2026-11-04): 0 errors over the 24 touched JS/Vue files (2 old `console.log` warnings in
      show.model.js; visualizer.js is an eslint-disabled file). `npm run build` passes and ships
      `dist/gdtf/`.

## 6. Fixes from the user's review (2026-11-04)

- [x] 6.1 Channels drive the view correctly. A Node sweep sets every drawable channel of every
      mode (757 GDTF modes from the test set, 1987 OFL modes drawn by `GeometryFixture`) through
      0-255 and checks the beam state. Fixed:
      - **GDTF brightness scale.** Dimmer and colours saturated at DMX 3.
      - **Mode masters.** The function active with the master at 0 is kept (Robin LEDWash RGB,
        Ayrton focus).
      - **Dimmers multiply** down the tree.
      - **Wheel colours** act as macros on colour-mixing beams; CMY fixtures keep a white
        source.
      - **Wheel slots typed by their wheel's use** (gobo and prism wheels without images).
      - **Prism:** "open" sets take the prism out; prism and dimmer functions on other channels
        are ignored.
      - **OFL:** the wheel name falls back to the channel name; zoom presets span the lens
        range; `BeamAngle` and colour presets are applied.
      - **Several frost channels** take the strongest.
      - **Pan/Tilt** on files without axes turn the channel's geometry.
      - **Crash** on OFL Pan/Tilt channels whose first capability has no angle.

      Remaining "no effect" entries are attributes the view doesn't draw (CTO, macros, blades,
      iris), shutters that only open and close (ignored, as by `MovingHead`), and a few file
      quirks.
- [x] 6.2 Beams and cells follow a fixture moved with the gizmo (world matrix checked every
      frame, as `MovingHead` does).
- [x] 6.3 GDTF bodies sit where the fixture puts them.
      - **Placement:** each model's mesh (glTF, else 3DS) is read at import for its box centre;
        meshes whose proportions don't match the model, or that sit off the origin, are skipped.
        Models without a mesh use the GDTF primitive conventions (1.0 centred, 1.1 hanging).
        Over the test set, 0 implausible centres remain.
      - **Roles:** a body holding an axis below the root is a yoke; pigtails get no body.
      - **Pan/Tilt** turn the geometry they name (20 channels in the test set name a plain
        geometry, for example the ACME XP-260 yoke).
- [x] 6.4 Prisms:
      - real facet layouts from GDTF, at most 16 facets; the spread scale is normalised, since
        exporters disagree on it;
      - a 4° minimum spread, so narrow beams split visibly;
      - the light is shared between facets.

      Prism rotation is not drawn (as before).
- [x] 6.5 Pan turns the outermost axis on the named geometry's path and Tilt the innermost.
      Files that name the head or the yoke for both, or that don't declare the head an axis,
      still pan the yoke and tilt the head. Checked over the test set: in 295 of 296 moving-head
      modes, Pan's node sits above Tilt's; the exception is a laser with no axes.
- [x] 6.6 Selection uses the MovingHead highlight (`InstanceHighlight`: fill and outline, X-ray)
      for every fixture. Body pieces are drawn from two shared instanced pools (box, cylinder)
      with the highlight attached, one draw per shape for the whole rig. Checked in Node: slots
      are allocated, highlighted and reused after a fixture is removed.

