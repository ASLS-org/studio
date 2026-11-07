# Tasks

## 1. Ground truth

- [x] 1.1 Walk every feature of the six Programming tasks in `npm start` with the manual demo
      show (`docs/manual/public/presets/manual.showfile.json`). Note the labels, defaults,
      ranges, units and anything that doesn't work into a scratch checklist (not committed).
      Add newly found bugs to the epic doc's backlog. Verify: the checklist covers every control
      named in design.md § Context.

## 2. Structure

- [x] 2.1 Sidebar per design D2 in `.vitepress/config.js`, section accents and icons in
      `shell/nav.js`. Verify: `docs:manual:serve` shows the four sections in order; every
      entry opens.
- [x] 2.2 Stubs per design D3 for the twelve old pages. Verify: each old URL renders its stub
      with a working link; none of them is in the sidebar.

## 3. Getting started

- [x] 3.1 *The interface* (`getting-started/interface`): the five regions, what each is for,
      how they connect (selecting in one opens another), with previews. Verify: the page's
      previews are ready; each region links to its task page.
- [x] 3.2 *Your first show* (`getting-started/first-show`) per design D5. Verify: follow it
      step by step in `npm start` from File → New Showfile; it ends with a playing chase.

## 4. Concepts

- [x] 4.1 *Show structure* (`concepts/`): show, universe and address, fixture and cells,
      group, cues (scene vs effect), chase, master row; what owns what. Verify: no repeat of
      How Studio works beyond a link; every term used in Programming pages is defined here.
- [x] 4.2 *Timing and playback* (`concepts/timing`): the Live clock, BPM and Tap Tempo, bars,
      quantize, play / pause / stop, Loop vs One Shot, Toggle vs Temporary, Absolute vs
      Relative start. Verify: each statement checked in the app (task 1.1 checklist).

## 5. Programming a show

Each page: what and why, live previews and demos, steps with exact labels, a settings table
with units and ranges, notes. Existing content from `modifiers/*`, `interface/*` and
`workflow/patching` moves here, rewritten task first.

- [x] 5.1 *Patching fixtures* (`programming/patching`): universes (settings), the patch popup
      (library, GDTF section pointer to unit 4, mode, address, amount, offsets), fixture
      settings and position, trying a fixture (channels, colour, pan/tilt, cells), deleting.
      Verify: previews ready; the steps patch a fixture in `npm start`.
- [x] 5.2 *Groups* (`programming/groups`): creating (New, the popup), group settings, its
      fixture pool, deleting. Verify: as 5.1.
- [x] 5.3 *Scenes* (`programming/scenes`): adding a cue, cue settings, scene fixtures,
      channels, colour picker, pan/tilt, cells, fade editor (curve presets, control points),
      relative start. Verify: as 5.1.
- [x] 5.4 *Effects* (`programming/effects`): modulated channels (Add, presets), channel fixture
      activity, the effect tool (waveform, min/max, freq, phase, direction, spread over
      fixtures or cells, phase start/stop). Verify: as 5.1; each waveform and direction
      described matches the app.
- [x] 5.5 *Chases* (`programming/chases`): creating a chase, chase settings, the timeline
      (adding, moving, resizing cue items, fold), quantize, loop / one-shot. Verify: as 5.1.
- [x] 5.6 *Playing a show* (`programming/playback`): playing cues (toggle / temporary), chases
      in the group pool, master rows, the group dimmer, Isolate, Blackout, the transport (BPM,
      play state, Tap Tempo). Verify: as 5.1.
- [x] 5.7 New presets per design D4 (each added to `_dev/previews.md`). Verify: each mounts or
      reaches its key moment with no errors on `/_dev/previews`.

## 6. Checks and context

- [x] 6.1 Headless pass over every new and stub page: previews ready, no errors, no overflow at
      1280 and 375 px, light and dark. Verify: script output clean.
- [x] 6.2 Label check: every bold UI label on the new pages exists in `src/views` (grep).
      Verify: no misses, or each miss explained.
- [x] 6.3 Update skill `user-manual` (Structure: the new sections and URLs, stubs, the
      task-first rule) and `openspec/epics/manual-overhaul.md` (unit 3 status, bugs found).
      Verify: grep shows the new sections.
- [x] 6.4 `npm run docs:manual:build` succeeds (dead links fail it) and `npx eslint --ext
      .js,.vue --ignore-pattern '!docs/manual/.vitepress'` on the touched theme files is clean.
      Verify: exit 0.

## Workflow follow-up

- `/opsx:archive document-show-programming` in the unit branch, then a PR into
  `epic/manual-overhaul`.
