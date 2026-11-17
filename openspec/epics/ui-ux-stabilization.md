# Epic: UI/UX stabilization

Branch: `epic/ui-ux-stabilization` (from `develop`). Workflow: skill `git-collaboration` § Epics.

## Goal

Make using and navigating Studio seamless and robust. Every control should do what it shows,
lists, selection, patching and playback controls should behave consistently, and no gesture
should leave the app in a broken or confusing state.

## Scope (2026-11-13, with the user)

- In scope: fixes and small features in the UI and its flow (uikit components, fragments,
  widgets, popups, navigation, and the engine fixes those need to behave correctly).
- Out of scope: new show features (new cue, effect, chase or output capabilities) unless the
  user asks for one specifically.
- Units stack on this branch, each one with a PR into it. The epic goes into `develop` only
  when the user decides.

## Units

| # | Branch | Content | Status |
|---|---|---|---|
| 1 | `fix/lists-patch-bay-and-playback` | Lists rebuilt (`uk-list`), patch bay media and fixture delete, fixture-deletion integrity, cue stop on delete, Temporary cues, Config outputs, PWM/bounce/quantize, manual link. Changes archived: `fix-effect-chase-values`, `wire-dead-controls`, `rebuild-uk-list`, `fix-fixture-deletion` | PR #79 |
| 2 | `feat/add-view-state` (stacked on 1) | One view state (`$view`) for the panel in view, selection (by id, remembered per group and universe), popups (named, one stack) and keys (one path); 3D highlight follows the selection; shaders compiled at boot; `npm run app:check`. Change archived: `add-view-state` | PR #80 |
| 3 | `feat/standardize-ui-styles` | Overflowing text scrolls on hover; selects mark the current value and take arrow keys; one design scale in `tokens.css` (fixed geometry kept apart in `views/utils/geometry.js`); the modifier strip, groups and patch bay resize from their whole border. Change archived: `standardize-ui-styles` | PR into the epic |
| 4 | `fix/fix-modifier-widgets` (stacked on 3) | Universe ID fixed (read-only); fixture pool fits its rows (250 to 400 px); effect tool fields clear of the canvas; fade play dot follows the curve. Change: `fix-modifier-widgets` | Archived (local, no PR yet) |
| 5 | `feat/add-channel-presets-and-icons` (stacked on 4) | Each channel has a box (icon, current range) opening a searchable `uk-list` of its labelled ranges; an icon for every OFL and GDTF channel. Change: `add-channel-presets-and-icons` | Archived (local, no PR yet) |
| 6 | `feat/add-curve-presets` (stacked on 5) | Fades play as drawn (solved for time); 30 named presets with curve pictures in the type select; overshoot (CP Y −1 to 2), scene output clamped to 0–255. Change: `add-curve-presets` | Archived (local, no PR yet) |
| 7 | `feat/add-repatch-popup` (stacked on 6) | Addresses 1–512; Fixture Settings Ch Start/Stop/Count read-only with an Edit button opening the Repatch popup (universe map, drag without overlap, Move to free range, Remove gaps, before/after changes, 3D preview); the patch popup shows the new fixtures as ghosts with explained errors and numbers identical fixtures; invert pan/tilt and swap in the engine (controls come with unit 8); `uk-num-input` `readonly`. Change: `add-repatch-popup`. Follow-up after unit 8: smart default placement of fixtures on patch | Archived (local, no PR yet) |
| 8 | `rework-position-tool` | Multi-selection, mirroring, Arrange popup (line, grid, circle, arc, spread on a shape, align, distribute, fan, aim) with a shortcut; invert pan/tilt and swap controls | Planned, explore first |
| 9 | `add-effect-scopes` | Pan/tilt XY scope with fixtures as dots, colour path scope; interactive later | Planned, explore first |

## Candidates (not planned yet)

- Splash screen and lists' own delete confirmations as named popups (left out of unit 2).

- Playback interaction within a group: cues stacking, chases versus cues started by hand
  (explore first, it may count as a show feature).
- Group modifiers keep references to deleted fixtures.
- An output universe number (Art-Net/sACN) set apart from the universe's ID, which unit 4 locks.
