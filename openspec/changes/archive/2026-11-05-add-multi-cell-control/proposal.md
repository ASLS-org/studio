# Proposal

Epic: `openspec/epics/gdtf-render-pipeline.md`, unit 5c. Planned on 2026-11-04, after 5a, before
5b.

## Why

Since 5a, fixtures can have several instances of the same channel: one dimmer and one RGB(W) set
per cell of a bar or matrix, two heads with their own Pan/Tilt, a master dimmer next to cell
dimmers. The engine stores every instance (`qaIndex`), and the visualizer draws each cell, but the
controls only reach the first one:

- **Scenes** (group modifier): the channel faders drop duplicates by type and colour, so cells 2 to
  N can't be set at all; Pan/Tilt writes the first head only.
- **Universe view** (fixture selected): the faders list every channel, but without saying which
  cell it belongs to; the colour picker sets every cell to the same colour; Pan/Tilt writes the
  first head only.
- **Effects** drive the first instance of their channel type only (`setQuickAccessor({ type })`
  without `qaIndex`): a dimmer chase on a 12-cell bar moves cell 1.
- **White and other emitters**: the colour picker writes R, G, B (and C, M, Y) only. W, warm and
  cold white, amber, UV and lime stay where they are.

## What Changes

- **Cells.** A fixture's cells are the parts that repeat a set of channels: GDTF geometries
  (heads, pixels, arrays) and OFL pixels. Channels outside any cell (master dimmer, strobe, OFL
  pixel groups) belong to the whole fixture.
- **Model.** `Fixture` and the scene's fixture values get a `cells` list and cell-aware colour and
  Pan/Tilt access (one cell, several, or all). The current `color` / `panTilt` getters and setters
  stay as the all-cells form, so existing callers keep working.
- **One cell selector**, shared by the universe and the scene modifiers: **All cells** (default),
  one cell, or several. It filters which faders, colour picker and Pan/Tilt show and where they
  write. Whole-fixture channels (master dimmer, strobe, pan on the base) stay visible. Hidden for
  fixtures with a single cell, which look as they do today.
- **Scenes** list every channel instance of the selected cells, not one per type.
- **Effects** drive every instance of their channel type. A new option spreads the phase across
  cells as it already spreads across fixtures (pixel chases).
- **RGBW.** On a fixture with a W channel, the colour picker writes W = min(R, G, B) and subtracts
  it from R, G and B. Amber, UV and lime stay manual faders.

## Capabilities

### New Capabilities
- `scenes`: scene controls per cell.
- `effects`: effects drive every cell, phase across cells.

### Modified Capabilities
- `fixtures`: a fixture's cells, the universe view's controls per cell, RGBW from the colour
  picker.
- `showfile`: the effect's cell phase option.

## Impact

- Showfile format: effects save the cell phase option; older files load with it off. Scenes
  already store every instance (`qaIndex`), so they load unchanged.
- Playback change in older shows: an effect on a multi-cell fixture moves every cell instead of
  cell 1. Called out in the manual.
- Unsaved marker: the cell selection is view state, never in `showData`.
- Live playback/timing: effects write more channels per tick (every instance): no allocation per
  tick; checked on a 64-cell fixture.
- WSC output: none.
- Visualizer: none (it already draws every cell).
- Web vs Electron: none.

## Out of scope

- Per-cell colour pickers stacked side by side (the selector replaces them).
- Mapping amber, UV or lime from the picker's colour.
- Pixel mapping from images or video.

## User manual

Universe and group modifier pages: the cell selector, per-cell scenes, effects across cells and
the cell phase option, RGBW from the colour picker.
