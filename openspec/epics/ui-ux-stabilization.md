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

## Candidates (not planned yet)

- Playback interaction within a group: cues stacking, chases versus cues started by hand
  (explore first, it may count as a show feature).
- Group modifiers keep references to deleted fixtures.
