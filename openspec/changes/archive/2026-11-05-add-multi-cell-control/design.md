# Design

## Context

See proposal.md for why. Current state, checked in the code on 2026-11-05:

- Profile channels carry `geometry` (GDTF geometry name, OFL pixel key or pixel group), but the
  runtime `Channel` (`models/DMX/channel.model.js`) doesn't copy it, so a fixture doesn't know its
  cells.
- Every channel instance has a `qaIndex` among the channels of its `type`, and scenes store
  `{ id, type, color, qaIndex, value, active }` per channel (`FixtureValue.channelValues`). Values
  of every instance are already saved and played back.
- `Fixture.color` / `FixtureValue.color` write every R, G, B (and inverted C, M, Y) channel with
  the same value. `panTilt` reads and writes the first Pan, Tilt and their fine channels.
- The scene fragment (`group.scene.modifier.fragment.vue`) builds its fader list by dropping
  duplicates by `type` and `color`. Edits go to `qaIndex` 0 only. The universe fragment lists
  `fixture.simplifiedChannels` (every channel).
- `FXChannel.update` (`effect.model.js`) writes `setQuickAccessor({ type })`, which is `qaIndex`
  0. Colour effects go through `fixture.color`, which allocates an array per fixture per frame.
  `computeFixturesPhasing` gives each `FXFixture` one phase from its rank, the direction and
  `fixturePhaseStart` / `fixturePhaseStop`.
- OFL pixel channels keep their name as `type` (`Red 1/4`), so the same kind of channel has a
  different type in each cell.

## Goals / Non-Goals

**Goals:**
- One definition of a fixture's cells, used by the universe view, scenes and effects.
- No change to how existing scenes are stored or played.
- Effects stay allocation-free per tick with any number of cells.

**Non-Goals:**
- Changing channel `type` keys or `qaIndex` (stored in showfiles).
- Group modifiers (`modifier.model.js`, marked for removal): they already move every instance.
- The visualizer: it already decodes every cell from the universe frame.

## Decisions

### 1. Cells come from the channels, by one pure rule

`src/models/fixtures/fixture.cells.js` (pure, next to the adapters) builds a mode's cells:

1. **Key.** Each channel with a `geometry` gets a kind key: its `type` with the geometry name
   removed (`Red 1/4` → `Red`; GDTF types don't contain it). Fine channels follow their coarse
   channel. OFL pixel groups (`matrix.groups`) count as the whole fixture.
2. **Candidates.** A geometry is a candidate when one of its keys is also driven by a geometry
   that is neither its ancestor nor its descendant in the mode's geometry tree (OFL has no tree:
   pixels are unrelated).
3. **Merge.** A candidate below another candidate belongs to it, so a multi-head fixture's cell
   holds its yoke's Pan and its head's Tilt.
4. **Result.** `[{ name, channels: [index...] }]` in channel order, plus the cell of each channel
   (`null` for the whole fixture).

Checked over the test sets with a prototype: 169 of 757 GDTF modes and 238 of 2240 OFL modes have
cells (2 to 64), with sensible groups (lenses, pixels, arrays, front and rear beams, lasers). The
others have none, so their views don't change.

The result is cached per profile mode in a `WeakMap` (profiles are frozen). `Channel` gains
`geometry` and `cell`. `Fixture` gains `cells` (read-only).

Alternatives: cells only from GDTF geometry references. That misses fixtures that define each
cell's geometry by hand, and OFL. Cells as "every geometry with a channel" would make every GDTF
moving head a multi-cell fixture (pan on the yoke, tilt on the head).

### 2. Cell-aware colour and Pan/Tilt on fixtures and scene values

A small module `models/DMX/cell.access.js` works on any list of channel entries
(`{ id, type, color, value }`) through a read and a write callback, so `Fixture` and
`FixtureValue` share it:

- `readColor(entries, cells)`, `writeColor(entries, rgb, cells, write)`: per cell, R, G, B direct,
  C, M, Y inverted. When the cell has a `White` channel, writing sets W = min(R, G, B) and
  R, G, B less W, and reading adds W back (clamped to 255). Warm and cold white, amber, UV and lime
  aren't touched.
- `readPanTilt(entries, cells)`, `writePanTilt(entries, value, cells, write)`: every Pan, Tilt
  and fine channel in the given cells. Reading returns the first one found.
- `cells` is a list of cell names, or `null` for all cells. Whole-fixture colour and Pan/Tilt
  channels are written under all cells and when no selected cell has its own.

`Fixture.setColor(rgb, cells)`, `getColor(cells)`, `setPanTilt(value, cells)` and
`getPanTilt(cells)` wrap it, and so does `FixtureValue`. The existing `color` / `panTilt` getters
and setters call them with `null`, so the callers outside this change keep their behaviour.
The exception is RGBW, which now also writes W.

### 3. Effects precompute their targets per cell

`FXFixture` builds, once (when created, and when the fixture's mode changes), a `targets` list:
one entry per cell plus one for the whole fixture, each with the channel indexes to write and
whether to invert them (CMY for colour effects). Matching is by kind key (decision 1), so OFL pixel
types match, and colour effects pick channels by `color`.

`FXChannel` gains `cellPhase` (Boolean, default false). `computeFixturesPhasing` then works on
phase slots: one per active fixture when it's off, one per cell (the whole-fixture entry takes the
fixture's first cell's phase) when it's on. The existing direction and start/stop rules are
reused unchanged, over the slots instead of the fixtures. Phases go into a `Float32Array` per
`FXFixture`, sized once.

`update(t)` loops over fixtures and targets, computes the value at the target's phase and calls
`fixture.setChannel(index, value)` for each index. There is no colour getter call, no object per
call and no allocation per tick. Cost: one waveform evaluation per slot and one `setChannel` per
channel written, about 64 evaluations and 192 writes per frame for a 64-cell RGB effect.

`setFixturesActivity` resets every target channel to 0, not only `qaIndex` 0.

### 4. One cell selector widget, two fragments

`fragments/modifiers/_widgets/modifier.widget.cells.vue` (`ModifierWidgetCells`): a `uk-widget`
holding a `uk-list` (Ctrl/Shift multi-select, as the fixture pool) with **All cells** and the
cells by name. It emits the selected names, or `null` for all. It's hidden when the fixture (or
every selected fixture) has no cells. Selection is fragment state: never in `showData`, so it
doesn't mark the show unsaved.

- **Universe fragment:** the faders list stays raw (each channel once, CH labels kept), filtered
  to whole-fixture channels plus the selected cells' channels. The colour picker and Pan/Tilt use
  `getColor` / `setColor` / `getPanTilt` / `setPanTilt` with the selection. The live mixin reads
  stay as they are.
- **Scene fragment:** fader rows are built as whole-fixture channels (one row per
  `type`/`color`/`qaIndex`, which matches today's rows for fixtures without cells), then one row
  per kind key and colour for the selected cells. A row keeps its targets (fixture value, `qaIndex`
  list). An edit writes every target through `setQuickAccessor`, so the scene stores each channel
  separately, as today. The selector lists the union of the selected fixtures' cell names. The
  dedup by `type`/`color` goes away.

### 5. Showfile

`FXChannel.showData` adds `cellPhase`. The constructor reads `channel.cellPhase === true`, so older
files open with it off. Scenes and fixtures don't change. The **Spread over** select (Fixtures /
Cells) sits in the effect wave widget under Direction, with Phase start and Phase stop side by
side below it.

## Risks / Trade-offs

- [Older shows: effects on multi-cell fixtures now move every cell] → This is the bug the change
  fixes. Called out in the manual. Nothing in the demo show has cells.
- [RGBW changes what the picker outputs on fixtures with W] → Only new picker edits. Stored scene
  values play back unchanged. The W fader still works by hand.
- [The cell rule misreads a fixture (for example two unrelated lamps that are really one cell)] →
  Checked over both test sets. A misread only adds a selector entry; **All cells** behaves like
  today's whole fixture.
- [Scene rows across selected fixtures of different types] → Rows match by kind key and colour,
  so a Dimmer row reaches every selected fixture's dimmers. Fixtures that lack a kind are skipped
  for that row.
- [Large matrices (64+ cells) in the selector] → `uk-list` filters and scrolls. The per-tick cost
  stays linear in channels written.

## Migration Plan

None: `cellPhase` defaults to off, and the scene and fixture formats are unchanged. Rolling back
drops the option from files saved in between (an older build ignores the key).
