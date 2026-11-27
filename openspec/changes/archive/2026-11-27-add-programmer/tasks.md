# Tasks

## 1. Engine (models/DMX)

- [x] 1.1 `Channel.programmed`, `Channel.parked` (runtime, `null` by default) and the `output`
  getter; `Universe.packFrame()` writes `parked`, else `programmed`, else `value.DMX` (invert and
  swap kept). Verify: in the console, set a channel's `programmed` to 60 while a scene sets it to
  255: the universe frame carries 60; set it back to `null`: 255 on the next tick.
- [x] 1.2 `programmer.js`: `Programmer.run(fixtures, write)`, `writing`, `held`, `clear(fixtures?)`;
  `Fixture.setChannel` stores into `programmed` (fine channel too) while `writing`; per-fixture
  `programmerCount`. Verify: `Programmer.run([f], (x) => x.setColor([255, 128, 0]))` sets only
  `programmed`, `value` unchanged; `clear()` empties `held`.
- [x] 1.3 `Fixture.park` / `unpark`, `parkedCount`, `showData.parked` and its load in
  `prepareFixtures`. Verify: park a channel → `*` appears → save → reload: still parked; an older
  showfile loads with nothing parked and no `*`.
- [x] 1.4 The programmer empties on show load and clear, and drops deleted fixtures. Verify: hold a
  fixture, load the demo show: `held` is empty; hold one, delete it: no error, count drops.
- [x] 1.5 Rest no longer takes hand values. Verify: the spec scenario "A hand-set level is not the
  rest" (set 128 by hand, clear, play and stop an Intensity scene: the Dimmer ends at 0).

## 2. UI (views)

- [x] 2.1 Universe modifier: every handler writes through `Programmer.run` on every selected
  fixture (channels by `setQuickAccessor`, colour per fixture, pan/tilt by angle with
  `angleRange`, else the same values). Verify: the spec scenarios "Two fixtures of different
  types", "A channel one fixture lacks", "Same colour", "Same angle".
- [x] 2.2 Channels widget live mode (`sources`, `held`): shows `output` through the live mixin,
  emits `input`, menu box and fader coloured (violet programmer, red parked, blue playback, rest
  default) and titled by `channelSource` (`views/utils/channel.source.js`); parked fader and
  value `locked` (new opt-in mode of `uk-fader` and `uk-num-input`, fader repaints on `color`);
  the scene editor unchanged. Verify: "A cue's value", "A programmer value", "At rest"; a scene
  still edits blind in the group view.
- [x] 2.3 Park / Unpark first in the channel's menu, then Clear while programmed, then the ranges,
  for the selected fixtures. Verify: "Parking a hazer", "Clear in the menu", "Clear one channel";
  "Hazer through a cue".
- [x] 2.4 `uk-widget` opt-in `actions` (square buttons after the title); the channels widget's
  **Clear programmer** and **Unpark** there, disabled from `held`; Preferences → Clear programmer
  (Ctrl+Shift+C). Verify: "Clear during a cue", "Clear the selected fixtures", "Nothing held",
  "Unpark the selection"; Escape still closes popups.
- [x] 2.5 Fixture pool rows read `· prog` / `· parked`; patch bay rows the address only. Verify:
  "Holding two fixtures".
- [x] 2.6 Show screenshots of the universe strip (programmer, parked and playback channels) to the
  user and wait for their OK before the checks below.

## 3. Checks

- [x] 3.1 `app:check`: a `programmer` scenario: hold during a cue (frame value), Clear (frame back),
  multi-fixture edits, Park through a cue and Clear, park saved, rest after a hand value, the
  colours and titles of the channels, the menu order, the header buttons' disabled states, the
  row marks. Verify: `npm run app:check -- --only programmer` passes.
- [x] 3.2 Full `npm run app:check` and `npm run docs:manual:check`, each run alone, after the user's
  OK. Verify: both pass.

## 4. Docs and AI context

- [x] 4.1 Manual: `programming/patching.md` (fixture channels on every selected fixture, colours of
  the faders, Park), `programming/playback.md` (the programmer, Clear, Park over everything, rest),
  `reference/shortcuts.md` (Ctrl+Shift+C),
  `reference/glossary.md` (Programmer, Park, Clear); the `fixture-channels` preset if its look
  changes. Verify: `npm run docs:manual:serve` shows them; `docs:manual:check` passes (3.2).
- [x] 4.2 AI context: `src/models/DMX/CLAUDE.md` (programmer and park at packing time, the order
  for masters in unit 4), `src/views/CLAUDE.md` (channels widget live mode, `channel.source.js`),
  skill `vue-ui-change` (`uk-widget` `actions`, `locked` fader and number field), skill
  `user-manual` coverage map, the epic's unit 3 row. Verify: every path and symbol named
  exists.
- [x] 4.3 `npx eslint` on all touched files is clean.

## Workflow follow-up

- Branch `feat/add-programmer` off `epic/show-control` (done, holds these artifacts).
- The user retests; archive only on their approval (sync `playback` and `patching`), then PR into
  `epic/show-control`.
