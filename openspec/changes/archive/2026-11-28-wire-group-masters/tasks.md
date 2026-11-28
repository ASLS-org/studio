# Tasks

## 1. Engine (models/DMX)

- [x] 1.1 `Fixture.setupFamilies()` marks channels `scale` (`'level'`, `'colour'` on fixtures
  without a level, else `null`) and links fine channels to their `coarse`. Verify: in the
  console, a MAC Aura's Dimmer is `'level'`, its shutter `null`; a generic RGB PAR's red is
  `'colour'`.
- [x] 1.2 `Group.output` (raw factor) shared through `CuePool` to `cue.output` and the claim
  token; `Master.level`, `Master.blackout`, `Master.prepare()` (group factors, Isolate, Blackout,
  `grand`); `UniversePool.master` called before packing. Verify: set a group's `master` to 128 in
  the console: its `output.factor` reads ~0.5 on the next tick.
- [x] 1.3 `Universe.packFrame` scales level and colour addresses (programmed × grand, else value ×
  group(slot) × grand, blended while fading, 16-bit pairs together, parked untouched). Verify: the
  spec scenarios "Half a group", "A shutter is not a level", "The programmer is not a group's",
  "Grand master and a group knob", "A hazer through DBO", "An RGB PAR", by universe frame values.
- [x] 1.4 `Group.showData` drops `master`, `solo`, `disabled`. Verify: "Moving a knob during a
  show" (no `*`), "Opening a show" (an older file with a group at 0 and Blackout on plays at full).

## 2. UI (views)

- [x] 2.1 `uk-cue-container`: the master column's knob and Blackout bound to `$show.master.level`
  and `.blackout`, no Isolate on it; groups unchanged. Verify: "Cutting a group", "One group
  alone", "Two groups isolated" in the app, on stage and in the universe frames.
- [x] 2.1b The activity dots show the output, two-tone (`Master.groupLevels` / `rigLevels`,
  `scaledLevel` shared with the packing); a held-back column greys its knob with the reason;
  `uk-knob` opt-in `reset` (double-click to full). Verify: "A dimmed group", "An idle group",
  "Another group isolated", "Back to full"; the master column's dots follow the rig.
- [x] 2.2 Show the group pool (a group dimmed, one isolated, DBO on) to the user and wait for
  their OK before the checks below.

## 3. Checks

- [x] 3.1 `app:check`: a `masters` scenario: group knob, shutter untouched, programmer untouched,
  Blackout, Isolate (one, two), grand master, DBO with a parked channel, an RGB PAR, a 16-bit
  dimmer, the activity dots, nothing marked unsaved. Verify: `npm run app:check -- --only masters` passes.
- [x] 3.2 Full `npm run app:check` and `npm run docs:manual:check`, each run alone, after the
  user's OK. Verify: both pass.

## 4. Docs and AI context

- [x] 4.1 Manual: `programming/playback.md` (Group Controls without the note, Master Rows with
  the grand master and DBO), `reference/limitations.md` (remove the masters row),
  `reference/glossary.md` (Grand master, DBO, Isolate), `concepts/timing.md` (masters after the
  merge); `getting-started/interface.md` (the activity dots).
  Verify: `docs:manual:check` passes (3.2).
- [x] 4.2 AI context: `src/models/DMX/CLAUDE.md` (masters at packing time, `scale`, not saved;
  replace the unit 4 note under Programmer and Park), the user-manual coverage map, the epic's
  unit 4 row. Verify: every path and symbol named exists.
- [x] 4.3 `npx eslint` on all touched files is clean.

## Workflow follow-up

- Branch `feat/wire-group-masters` off `epic/show-control` (done).
- The user retests; archive only on their approval (sync `master`), then PR into
  `epic/show-control`.
