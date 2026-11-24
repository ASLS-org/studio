# Tasks

## 1. Engine (models/DMX)

- [ ] 1.1 Add `claims.js` with `Claims`:
  - tokens: `take(cue)`, `release`, `hold`, `releaseHeld`, and the live-token `Set`;
  - the frame: `beginFrame`, `writer`, the reused `dirty` array, `settle()`.
  `Live.update` calls `beginFrame()` before the animations and `settle()` before the frame
  callbacks. Verify: `app:check` sees tokens and the frame count advance.
- [ ] 1.2 `Channel` runtime fields:
  - `top`, `topValue`, `under`, `underValue`, `frame`;
  - `owner`, `heldToken`, `heldValue`, `restValue`;
  - `dimmer` and `defaultValue` (the profile's home value, else 128 for Pan/Tilt, else 0).
  `Fixture.setChannel` proposes when a writer is set (ranking, held owner) and writes otherwise;
  the settle pass writes coarse and fine. Verify: the 50 ms main-thread check passes on the demo
  show.
- [ ] 1.3 Cues:
  - `priority` and `intensityMode` are saved, defaulting to 1 and 0;
  - `cue(true)` takes `claim`, and `playItem` takes `itemClaim` on entering;
  - each update copies `factor`, `releasing` and `relative` onto the token and sets the writer;
  - `stopNow` releases, except at a scene's natural end (hold); `endItem` holds;
    `Chase.cue(false)` and `CuePool.delete` release.
  Verify: in the app, a High effect keeps Pan over a newer Normal scene, and stopping it fades
  Pan into the scene.
- [ ] 1.4 Cues write plain values. Remove the blending in `Scene.update`, `writeTargetBlend`,
  `recordStart` and `target.start`, `prepareStartValues` and `startValue`. Fades come from the
  settle pass. Verify: the `fxfades` checks pass, updated where a value now comes from the live
  value underneath.

## 2. UI (views)

- [ ] 2.1 Cue Settings: **Priority** (Low, Normal, High, Top) and **Intensity** (HTP, LTP)
  selects. Verify: both are saved, and the show is marked unsaved.
- [ ] 2.2 Master column: Isolate becomes **Release** (`Claims.releaseHeld()`). Verify: an ended
  scene's look gives way to an older running effect after Release.

## 3. Checks

- [ ] 3.1 Add an `app:check` scenario `priorities`, with these checks:
  - older shows load as Normal / HTP and stay saved;
  - a higher priority wins whatever the start order;
  - at equal priority the last started wins, Live's order shuffled, chase items included;
  - HTP dimmers take the max, and an LTP dimmer effect wins over a scene;
  - a fade-in over a moving effect starts from its live value;
  - a stop crossfades into the effect, and the only cue fades to the defaults;
  - an ended scene holds against an older effect, comes back when a newer effect over it stops,
    and gives way on Release;
  - no app errors.
  Verify: `--only priorities --only fxfades` passes, then the full run alone.

## 4. Docs and AI context

- [ ] 4.1 Manual:
  - `concepts/timing.md`, What Plays Together: priorities, HTP and LTP, fades with what is
    underneath, defaults, held looks;
  - `programming/playback.md`: Release;
  - `programming/scenes.md`: Cue Settings (Priority, Intensity) and fades;
  - `programming/effects.md`: Fading in and out;
  - `reference/glossary.md`: Priority, HTP, LTP, Release, Default.
  Verify: `npm run docs:manual:check` passes for those pages.
- [ ] 4.2 AI context:
  - `src/models/DMX/CLAUDE.md`: claims, the settle pass, plain writes;
  - root CLAUDE.md, rule: playback writes propose through `Fixture.setChannel` with a writer, and
    the settle pass decides.
  Verify: it reads correctly against the code.
- [ ] 4.3 `npx eslint` on all touched files is clean.
