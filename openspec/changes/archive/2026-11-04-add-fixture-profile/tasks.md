# Tasks

## 1. Baseline

- [x] 1.1 Save a reference before changing code: in the scratchpad, a Node script that loads every
      bundled OFL fixture (`public/fixtures/**`) and, for each mode, records the channel list with
      today's derived `type`, `color`, fine pairing and `qaIndex` (logic copied from
      `Channel.setChannelTypes()` and `Fixture.setupQuickAccessors()`). Verify: it writes a JSON
      reference covering all fixtures in `fixture_list.json`, and reports any that fail to parse.

## 2. Engine: fixture profile (models)

- [x] 2.1 Create `src/models/fixtures/fixture.profile.js` with JSDoc typedefs for the profile,
      mode, channel and capability (design.md decision 2). Verify: `npx eslint` clean.
- [x] 2.2 Create `src/models/fixtures/ofl.adapter.js`: OFL JSON → profile, including the legacy
      `type`/`color` derivation, fine channel offsets, the GDTF attribute map (decision 7) and
      precomputed capabilities with a 256-entry lookup per channel. Keep it free of Vue, Three.js
      and `import.meta`. Verify: `npx eslint` clean.
- [x] 2.3 Create `src/models/fixtures/fixture.library.js`: loads `fixture_list.json`, fetches OFL
      files, builds and caches frozen `markRaw` profiles per `source/manufacturer/model`. Verify:
      `npx eslint` clean.
- [x] 2.4 Run the 1.1 script against `ofl.adapter.js` and compare. Verify: zero differences in
      `type`, `color`, fine pairing and `qaIndex` across every fixture and mode; list and justify
      any fixture that cannot match.
- [x] 2.5 Rework `Fixture`, `Channel` and `Capability` to build from a profile and a mode name
      (index accepted and normalised): channels from profile channels, quick accessors on `type`,
      capability lookup through the table, `getValue` into a reused object, the 16-bit split from
      decision 6. Remove the per-instance OFL deep copy. Verify: `npx eslint` clean; `grep -rn
      "OFLData" src` only matches the library loader and adapter.
- [x] 2.6 Fixture `showData` writes `mode` (name) and `source`; load defaults a missing or unknown
      mode to the first one and a missing source to `ofl`. `Show.prepareFixtures()` gets profiles
      from the library. Verify: load the demo show (no modes saved): every fixture loads in its
      first mode with no console errors.
- [x] 2.7 Update `src/models/DMX/CLAUDE.md` (object graph: Fixture → profile; profile module and
      its purity rule), skill `fixture-library` (profiles, adapter, the type-key stability rule)
      and root `CLAUDE.md` § Architecture map. Verify: the three files mention
      `src/models/fixtures/` and the type-key rule.

## 3. UI: patch popup and fixture settings (views)

- [x] 3.1 Universe patch popup: list and load fixtures through the library, read modes and
      category from the profile, pass the selected mode name and the profile to `addRaw` instead of
      a JSON copy of the OFL data. Verify: spec "Patch a fixture in a non-default mode" (2 fixtures
      in mode 2 occupy 1-20 and 21-40; faders list mode 2's channels).
- [x] 3.2 Check the fixture settings widget mode selector still switches mode. Verify: changing a
      patched fixture's mode updates its channel faders, and the new mode survives save and reload
      (spec "Reload keeps the mode").
- [x] 3.3 Manual: in `docs/manual/modifiers/universe/index.md`, fixture settings table, describe
      Mode as saved with the show. Verify: the page compiles on `npx vitepress dev docs/manual`.
- [x] 3.4 `Fixture` `modeIndex` setter keeps values of channels present in both modes
      (`type#qaIndex`, coarse before fine), zeroes the others and pushes all of them to the 3D
      model (design.md decision 8). Verify: spec "Switch to a mode with the same core channels".
- [x] 3.5 Add `Universe.changeFixtureMode(fixture, modeIndex)` and make the fixture settings
      widget use it, reporting a refused change through `app_error`. Verify: specs "Larger mode
      fits" and "Larger mode would overlap".
- [x] 3.6 Manual, `docs/manual/modifiers/universe/index.md`: say that changing mode keeps the
      values of channels both modes share and is refused when it would overlap another fixture,
      and that fader values set in the universe view are not saved with the show (scenes are).
      Verify: the page compiles on `npx vitepress dev docs/manual`.

- [x] 3.7 Select input (`uikit.input.select.vue`): render the option list through `<Teleport to="body">`
      (fixed position) instead of moving it by hand, and recompute its position on scroll and
      resize while open. Fixes the list left on screen after a refused mode change re-renders
      the select, and the list not following its input on scroll (older bug). Verify: after a
      refused mode change no option list stays on screen; an open list follows its input when a
      panel scrolls; selects in the patch popup, effect and chase widgets still open, pick and close.

## 4. Integration

- [x] 4.1 Spec "Demo show scenes": load the demo show, start scenes with Dimmer, Zoom and colour
      values. Verify: the channel faders reach the saved values and the visualizer reacts as before.
- [x] 4.2 Spec "Fine channels": run a pan effect on a fixture with Pan fine. Verify in the
      universe channel view that Pan and Pan fine change smoothly and Pan never overshoots its
      target by a full step.
- [ ] 4.3 Load a showfile saved by this build in the previous build (`develop`). Verify: it loads
      without errors (extra `mode`/`source` keys ignored).
      **Deferred by the user (2026-11-04):** cross-build checks wait until later in the epic.
- [x] 4.4 `npm run build`. Verify: build succeeds.
- [x] 4.5 Run `npx eslint` on all touched files. Verify: it reports no errors.

## Workflow follow-up

- Archive with `/opsx:archive add-fixture-profile` in this unit branch, set unit 1 to `archived`
  in `openspec/epics/gdtf-render-pipeline.md`, then open the PR into `epic/gdtf-render-pipeline`.
