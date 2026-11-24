# Tasks

## 1. Engine (models/DMX) and placement maths

- [x] 1.1 `views/utils/placement.js`: line, grid, circle, arc, align, distribute, fan, aim
  on `[{ position, rotation }]`, and `Fixture.setPose`. Verify (app:check): Line X spacing 2 on
  four fixtures gives −3, −1, 1, 3; Aim at a point below gives X 180.

## 2. UI (views)

- [x] 2.1 `uk-num-input` `relative`: placeholder shown for a `null` value, and a `step` event from its
  arrows and arrow keys. Verify: Position Tool shows `--` for mixed X; one arrow press nudges each fixture.
- [x] 2.2 Position Tool on `fixtures`: count in header, shared/mixed fields, typing sets all,
  nudge, *Arrange* header button; an edit pose re-attaches the gizmo to the whole selection. Verify in
  the app with two demo fixtures selected, and app:check.
- [x] 2.3 Arrange popup: mode list with an icon per mode, as tall as the list, settings per mode
  (scrolling, applied on Enter/blur), live 3D draft, OK keeps, Cancel/Escape restores, **A** opens
  it. Typing `12.5` keeps every digit. Verify: Circle then Cancel restores every pose; Line + OK keeps it.
- [x] 2.4 Gizmo keys through `$keyboard` (T, R, H, Ctrl+Z), the `window` listener in
  `controls.js` removed. Verify: T/R switch the gizmo mode; typing "t" in a field doesn't.

- [x] 2.5 Stage map, X / Y / Height and mount, turn, tilt in the widget (mount maths in
  `placement.js`); Arrange search box and Apply (`uk-popup` `actions` slot); `uk-button` starts
  toggled from `modelValue`. Verify: app:check mounts, map drag and Apply.

## 3. Checks and docs

- [x] 3.1 `app:check` scenario `position`: mixed fields, typing on several, nudge, typing a
  decimal in Arrange, Line + OK, Circle + Cancel restores, Apply, mounts, map drag, each mode's
  maths and mounts.
  Verify: passes.
- [x] 3.2 Manual: `programming/patching` (Position Tool: several fixtures, Arrange), `interface/visualizer` (placing fixtures, keys), `reference/shortcuts`
  (A); preset
  `fixture-position` (props change to `fixtures`). Verify: `npm run docs:manual:check` all clear.
- [x] 3.3 AI context: `views/CLAUDE.md` (placement maths in `views/utils/placement.js`), skill
  `vue-ui-change` if `uk-num-input` gains `step`; visualizer CLAUDE.md for the key path. Verify:
  each says so.
- [x] 3.4 `npx eslint` on all touched files is clean.
