# Design

## Context

See proposal.md (Why). What the code does today:

- `Universe` keeps `_patch` (fixture by `chStart`, 0-based) and `_addressMap` (512 entries: the
  `chStart` owning each address). `patchFixture`, `unpatchFixture` and `changeFixtureMode` keep
  both in step; `packFrame()` copies each owned address's channel value into the 512-byte frame
  once per Live tick (the visualizer and the WSC stream read that frame).
- Fixture Settings binds `v-model.lazy="fixture.chStart"`: it sets the fixture's start without
  touching `_patch` / `_addressMap`, so both go stale.
- `canPatchMany` tests `if (this._addressMap[i])`: the fixture at address 0 owns slots holding 0,
  so its range reads free; it never checks the end of the universe. `findChStartAutoPatch` checks
  `!= null` correctly.
- Addresses are shown 0-based: `Fixture.listable.more` = `U{universe}-CH{chStart}`, Fixture
  Settings' *Address*, the patch popup's *Address* (0–512) and *Stop*; the manual says so.
- Pan/tilt channels per cell are found by `isAxisChannel(channel, 'Pan' | 'Tilt')`
  (`models/DMX/cell.access.js`); a coarse channel lists its fine channels in `fineIndexes`.
- Popups are named in `$view` with `modal(name, owner)`; the patch popup is `universe.patch`.

## Goals / Non-Goals

**Goals:** 1-based display, the repatch popup and map, the patch popup map, invert/swap, the
patch map bugs.

**Non-Goals:** the output universe number; per-cell invert; drag-to-patch new fixtures.

## Decisions

- **Display only:** a `dmxAddress(chStart)` helper (`chStart + 1`) in `views/utils`; every view
  shows it; `listable.more` becomes `U{universe}-CH{chStart + 1}`. Inputs convert back. Storage
  and engine stay 0-based.
- **Repatch in the engine:** `UniversePool.repatch(moves)` with `moves` = `[{ fixture, universe,
  chStart }]`. It validates the result first (per target universe, no overlap with fixtures that
  stay or move, `chStart + chCount <= 512`) and throws without changing anything when invalid; it
  then unpatches every moved fixture before patching them at their targets, so swaps between two
  fixtures work. Each unpatch and patch emits `patch_changed`; the visualizer coalesces them
  per animation frame. `$view` keeps the fixture selected (ids don't
  change). Fixture Settings shows *Ch Start*, *Ch Stop* and *Ch Count* as disabled number fields and an *Edit*
  header button opening the popup.
- **Fix the map:** `canPatchMany` tests `!= null` and the end of the universe.
- **Map component:** `universe/_widgets/universe.modifier.map.vue`, plain DOM: a 32-column grid of
  512 cells (address labels every row start), and one block per fixture, split into one segment
  per row it spans, coloured with the universe colour, labelled with the fixture name on its
  first segment. Props: `universe`, `draft` (`chStart` by fixture id, for this universe),
  `highlight` (`{ chStart, count }` for the patch popup), `readonly`, `selection` (ids). Events:
  `select`, `move` (delta in addresses, snapped). Conflicting blocks (overlap or past 512) get a
  red style. Pointer drag moves the selected blocks together by whole addresses; no allocation
  concerns (UI only).
- **Repatch popup:** `universe/_popups/universe.modifier.popup.repatch.vue`, `modal('universe.repatch',
  'universe')`. Holds the draft (`{ fixtureId: { universe, chStart } }`), the shown universe (a
  select of universes), the selection (starting with the fixture it was opened from). *Move to free
  range* finds the first range fitting the selected fixtures in order (ignoring their own current
  ranges); *Remove gaps* packs the shown universe in address order; *Reset* restores the patch.
  Each is disabled when it would change nothing. A side panel lists the changes (before → after,
  a `uk-list`) and messages (overlaps naming both fixtures and addresses; a warning per move to
  another universe). The selection goes to `$view.previewFixtures` so the 3D view highlights it.
  Drag follows the slot under the pointer (clamped to the grid); the delta is clamped so the
  selection stays within 1–512, and a delta that would overlap a fixture outside the selection is
  refused (the blocks stay at the last one that fitted), so a drag never creates an overlap.
  Blocks look like chase items: flat, square, slightly transparent. Fixtures dragged from another
  universe into the shown one are drawn there. *OK* calls `repatch` with the changed entries;
  disabled while any conflict exists.
- **Patch popup:** shows the map with `highlight` = the range of the fixtures to patch, red when
  `canPatchMany` fails; *Address* and *Stop* show 1–512.
- **Invert / swap:** `Fixture` gains `invertPan`, `invertTilt`, `swapPanTilt` (saved; default
  false). Setting one rebuilds, on each of its channels, `outputSource` (index of the channel
  whose value goes out here) and `outputInvert`: for each cell, swap exchanges the pan and tilt
  coarse channels and their fine channels pair by pair (only when both exist), and invert marks
  the pan (or tilt) coarse and fine outputs. `packFrame` writes
  `v = channels[channel.outputSource].value.DMX; frame[i] = channel.outputInvert ? 255 - v : v`
  (plain numbers, no allocation). Invert is applied after swap, on the output channel's axis.
  No control yet: the options are set in the engine only, their UI comes with
  `rework-position-tool`.

## Risks / Trade-offs

- [A repatch across universes leaves `$view`'s per-universe selection pointing at a fixture now
  elsewhere] → `$view` resolves ids on read and falls back to the first fixture.
- [Swap on fixtures whose pan and tilt have different resolutions] → Pairs coarse with coarse and
  fine with fine; an unmatched fine channel keeps its own value.
- [512 cells of DOM in a popup] → Built only while the popup is open.

## Migration Plan

None: the new fixture fields default to off; addresses are unchanged on disk.

## Open Questions

None.
