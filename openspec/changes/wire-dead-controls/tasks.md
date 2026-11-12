# Tasks

## 1. Engine (models/DMX)

- [ ] 1.1 `UniversePool`: `genUniverseId` returns max id + 1 (0 when empty); `addRaw` regenerates
  only a missing id (`== null`); `listable` drops `unfold` after grepping for other users (D2,
  D3). Verify: with universes 0, 3, 1, a new universe gets id 4.
- [ ] 1.2 `Show.deleteUniverse(universe)`: delete its fixtures through `deleteFixture`, stop its
  stream, delete it from the pool (D4). Verify: deleting *Stage* in the demo show empties group
  *Rig* and its cues, and the visualizer shows no fixtures.
- [ ] 1.3 Outputs on load and save: `loadFromData` stops resolving `o.universe`;
  `OutputPool.showData` writes `output.universe?.id ?? null` (D4). Verify: add a connection,
  delete its universe, save, reload: no error, the connection is listed.

## 2. UI (views)

- [ ] 2.1 Cue pool widget: Temporary cues play on pointer down and stop on pointer up, cancel or
  drag; a click does nothing for them (D1). Verify: hold a Temporary scene 2 s, it plays and
  stops; release outside the tile stops it; a Toggle cue still toggles; dragging a cue onto a
  chase still works.
- [ ] 2.2 Patch bay: universes only (no accordion), click opens the universe, **New** adds and
  opens a universe, `@delete` deletes the selected universes and closes the universe view if it
  showed one (D2–D4). Verify each in the app, and the show turns unsaved after adding or
  deleting.
- [ ] 2.3 `uk-list`: optional `delete-message` prop for the confirmation text (D4). Verify: the
  patch bay's popup names the fixture count; the universe view's fixture pool keeps its text.
- [ ] 2.4 Universe settings widget: **Config** opens the Connections popup (D5). Verify in the app
  and in the manual's `universe-settings` preview.

## 3. Docs

- [ ] 3.1 Manual: `getting-started/interface#patch-bay` (universes only, New, delete),
  `programming/patching` (open a universe instead of unfolding; adding and deleting universes),
  `getting-started/first-show` (step 1 wording), `programming/scenes` and `programming/playback`
  (Temporary; remove the note), `rig/outputs` (Config; remove the note), `interface/visualizer`
  and `concepts/index` (patch bay wording), `reference/limitations` (remove the Config, Trigger
  Style and patch bay rows). Presets `patch-bay`, `patch-bay-select` (rework or remove),
  `patch-bay-filter`, `visualizer-modes`, `cue-settings`, `group-cuepool`, `universe-settings`;
  update the coverage map if a preset goes. Verify in `npm run docs:manual:serve`, then
  `npm run docs:manual:check` passes.
- [ ] 3.2 AI context: `src/views/CLAUDE.md` (the patch bay holds top-level items only; also fix
  its stale `/_dev/previews` mention, that page was removed); remove the Trigger Style, patch bay
  New, patch bay delete and Config entries from the backlog in `openspec/epics/manual-overhaul.md`.

## 4. Check

- [ ] 4.1 `npx eslint` on all touched files is clean.
