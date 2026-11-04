# Tasks

## 1. Engine: cells (models/fixtures, models/DMX)

- [x] 1.1 `src/models/fixtures/fixture.cells.js` (pure): kind keys, candidates, merge, cached per
      profile mode (design decision 1). Verify with the Node harness over both GDTF test sets and
      the OFL library: 169 of 757 GDTF modes and 238 of 2240 OFL modes have cells, fixtures without
      repeated parts have none, and no error.
- [x] 1.2 `Channel` keeps `geometry` and `cell`; `Fixture.cells` (read-only). Verify in Node on a
      patched 8-pixel bar, a two-head fixture and the demo MAC Aura (8 cells, 2 cells, none).

## 2. Engine: colour and Pan/Tilt per cell (models/DMX)

- [x] 2.1 `src/models/DMX/cell.access.js`: read/write colour (RGB, inverted CMY, RGBW split) and
      Pan/Tilt over channel entries for a list of cells or all (design decision 2). Verify in Node:
      RGBW pick 255/128/128 writes W 128, R 127, G 0, B 0 and reads back 255/128/128; a cell write
      leaves the other cells unchanged.
- [x] 2.2 `Fixture` and `FixtureValue`: `getColor` / `setColor` / `getPanTilt` / `setPanTilt` with
      cells; `color` and `panTilt` delegate with all cells. Verify in the running app (`npm
      start`): the demo show's colour picker and Pan/Tilt behave as before, in the universe view
      and in a scene.

## 3. Engine: effects across cells (models/DMX)

- [ ] 3.1 `FXFixture` targets per cell and for the whole fixture, matched by kind key and colour,
      rebuilt when the fixture's channels change (mode change); `update` writes them with no
      allocation per tick; `setFixturesActivity` resets every target (design decision 3). Verify
      in the running app: a dimmer sine on a 12-cell bar moves every cell; the demo show's effects
      play as before.
- [ ] 3.2 `FXChannel.cellPhase` (default off) and phase slots over cells in
      `computeFixturesPhasing`, saved in `showData` and read on load. Verify in the running app: a
      square wave across cells with phase 0 to 360 runs along an 8-cell bar; save, reload, the
      option is still on; an older showfile opens with it off.
- [ ] 3.3 Per-tick cost: profile a 64-cell RGB effect in the running app (Performance panel):
      no allocation in `FXChannel.update`, frame time within the visualizer's budget.

## 4. UI: cell selector (views)

- [ ] 4.1 `fragments/modifiers/_widgets/modifier.widget.cells.vue` (`ModifierWidgetCells`):
      **All cells** plus the cells, Ctrl/Shift multi-select, hidden without cells (design decision
      4). Verify in the running app: shows for a pixel bar, hidden for the demo moving heads,
      selecting cells doesn't mark the show unsaved.
- [ ] 4.2 Universe fragment: the selector, faders filtered to whole-fixture and selected cells'
      channels, colour picker and Pan/Tilt per selection. Verify in the running app: cell 3 blue on
      an 8-pixel bar lights only cell 3 in the visualizer; the second head's Pan/Tilt moves only
      that head.
- [ ] 4.3 Scene fragment: the selector, rows per whole-fixture channel and per kind key for the
      selected cells, writes to every target; the `type`/`color` dedup goes. Verify in the running
      app: cell 7's dimmer at 200 is stored and played for cell 7 only; **All cells** sets all of
      them; the demo show's scenes show the same faders as before.
- [ ] 4.4 Effect wave widget: **Across cells** checkbox next to Phase start / Phase stop. Verify
      in the running app: toggling it marks the show unsaved and changes the running effect.

## 5. Docs

- [ ] 5.1 Manual: universe and group modifier pages (cell selector, per-cell scenes, effects
      across cells and the **Across cells** option, RGBW from the colour picker, older shows'
      effects moving every cell). Verify with `npm run docs:manual:serve`: pages render, media
      TODOs listed.
- [ ] 5.2 AI context: `src/models/DMX/CLAUDE.md` (cells, `cell.access.js`, effect targets) and
      `src/views/CLAUDE.md` (the shared cells widget). Verify that every path mentioned exists.
- [ ] 5.3 `npx eslint` on all touched files is clean.

## Workflow follow-up

- Archive the change in this branch, update the epic status table, then open a PR into
  `epic/gdtf-render-pipeline`.
