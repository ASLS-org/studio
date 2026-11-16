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
| 5 | `add-channel-presets-and-icons` | A preset menu on each channel from its capability ranges; icons for every channel type in the library | Planned |
| 6 | `add-curve-presets` | More fade curve presets | Planned |
| 7 | `add-repatch-popup` | Address read-only plus a Repatch popup: universe map, drag ranges, auto-patch, invert pan/tilt and swap; the same map in the patch popup | Planned, explore first |
| 8 | `rework-position-tool` | Multi-selection, mirroring, Arrange popup (line, grid, circle, arc, spread on a shape, align, distribute, fan, aim) with a shortcut | Planned, explore first |
| 9 | `add-effect-scopes` | Pan/tilt XY scope with fixtures as dots, colour path scope; interactive later | Planned, explore first |

## Candidates (not planned yet)

- Splash screen and lists' own delete confirmations as named popups (left out of unit 2).

- Playback interaction within a group: cues stacking, chases versus cues started by hand
  (explore first, it may count as a show feature).
- Group modifiers keep references to deleted fixtures.
- An output universe number (Art-Net/sACN) set apart from the universe's ID, which unit 4 locks.
