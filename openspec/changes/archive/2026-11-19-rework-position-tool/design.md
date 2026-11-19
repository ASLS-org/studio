# Design

## Context

- `universe.modifier.widget.fixture.position.tool.vue` binds six `uk-num-input`s to one fixture's
  `posX…rotZ` setters (`Fixture`, metres and degrees; each setter emits `fixture_pose`).
- The universe fragment passes `selectedFixture` (first of `$view.universeFixtures`); the fixture
  pool and `fixture_renderer.setSelection` already handle several ids, and the gizmo moves them
  as a group.
- Orientation: Z up; a fixture's rotation is a three.js `XYZ` Euler; rotation 0 points the beam
  up (+Z), rotation X = 180° hangs it (visualizer CLAUDE.md).
- `controls.js` listens to `window` keydown for T/R/H/Escape/Ctrl+Z, against the `$keyboard` rule.

## Goals / Non-Goals

**Goals:** every placement action works on the selection; placement maths in one pure module the
app check can call; no new saved fields.

**Non-Goals:** visualizer changes beyond the key move; per-fixture history/undo.

## Decisions

1. **Widget takes `fixtures` (array).** The fragment passes `$view.universeFixtures`. Each field
   is a computed `{ value | null }`: shared value or `null`, shown via `uk-num-input`'s
   placeholder `--`. Typing calls `setAxis(axis, value)` on all; the arrows call
   `nudge(axis, ±step)`. `uk-num-input` gains `relative`: its arrows and arrow keys emit `step`,
   so a nudge doesn't depend on the displayed value. Each write is `Fixture.setPose`, one
   `fixture_pose` per fixture; an edit pose re-attaches the gizmo to the whole selection. Alternative (fields as
   offsets) rejected in explore: less obvious.
2. **`views/utils/placement.js`** (pure, no Vue, uses three's math classes only): `line`, `grid`,
   `circle`, `arc`, `align`, `distribute`, `fan`, `aim`. Each takes and returns
   `[{ position, rotation }]` in metres/degrees, so it is checked headlessly and reused later for
   smart placement on patch. Aim builds the quaternion from +Z to `target − position` and converts
   to an `XYZ` Euler.
3. **Arrange popup** `universe.modifier.popup.arrange.vue` (`PopupMixin`, named modal owned by
   the universe panel). On open it snapshots every selected fixture's pose; each settings change
   writes `placement.<mode>(snapshot, settings)` through the fixtures' `position`/`rotation`
   setters (the 3D view follows through `fixture_pose`); Cancel/close writes the snapshot back.
   Layout: mode `uk-list` left (an icon per mode, `arrange_*.svg`: dots in that shape), the popup
   as tall as the list; settings right, scrolling when longer. Fields apply on Enter or blur (no
   `auto-update`: it reformats after the first key, so `12` or `1.5` couldn't be typed).
4. **Keys**: `Controls` gets `handleKey(e)` returning true; the visualizer fragment registers it
   with `$keyboard.addShortcut` (T, R, H, Ctrl+Z; Escape stays with the top layer first). **A**
   is a universe-panel shortcut opening Arrange when fixtures are selected.

5. **Stage map** `universe.modifier.stage.map.vue`: an SVG in metres (viewBox fitted to the
   fixtures, ≥ 8 m, frozen while dragging), pointer → metres through `getScreenCTM()`. It emits
   `selection` and drag deltas; the widget snapshots poses on drag start and writes
   snapshot + delta. Square and flush like the pan/tilt grid.
6. **Mounts** in `placement.js`: `MOUNTS` (base rotations), `mountRotation(mount, turn, tilt)` =
   mount · Rz(turn) · Rx(tilt) as an XYZ Euler, and `mountOf(rotation)`, the mount whose
   remainder decomposes as Z·X with the least tilt (`exact` false otherwise). Raw X/Y/Z rotation
   fields were tried and dropped.
7. **Arrange Apply**: a `uk-popup` `actions` slot (footer, left); Apply re-snapshots the poses.

## Risks / Trade-offs

- [Many fixtures × each settings change emits `fixture_pose`] → poses are written once per change
  (not per tick); 100 fixtures is well under a frame. No Live animation is added.
- [Mixed-value field typed by mistake flattens an axis] → no undo yet; the `--` makes the mix
  visible before typing.
- [Euler conversion near gimbal lock (aiming straight down)] → the module returns X = 180°, Y = Z
  = 0 for a target directly below; checked in app:check.
