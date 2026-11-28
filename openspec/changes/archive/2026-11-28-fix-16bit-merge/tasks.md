# Tasks

## 1. Engine (models/DMX)

- [x] 1.1 `FixtureValue` links each coarse entry to its fine partner (runtime, never saved);
  `Scene.update` sends `coarse + fine / 255` for a coarse entry with an active fine partner and
  skips the fine entry. Verify: "A 16-bit dimmer" (frame 200/128) in the app.
- [x] 1.2 `app:check`: the `masters` scenario's 16-bit scene plays 200/128 and scales as one value
  (group knob at 128: 100/164). Verify: `npm run app:check -- --only masters` passes.

## 2. Checks

- [x] 2.1 Full `npm run app:check`, alone. Verify: it passes.
- [x] 2.2 `npx eslint` on touched files is clean.

## Workflow follow-up

- Branch `fix/16bit-merge`, stacked on `feat/wire-group-masters`; PR into `epic/show-control` once
  #87 is merged.
