# Tasks

## 1. Engine: effects (models/DMX)

- [x] 1.1 `FX` gets `fadeIn` / `fadeOut` (`Fade`, directions 0 and 1) with `duration` in bars,
  0 when the showfile has none. `showData` saves `{ type, controlPoints, duration }`. Verify:
  `app:check` `fxfades`, save and reload.
- [x] 1.2 Each `FXFixture` target gets a `start` `Float64Array`, allocated in `buildTargets` and
  filled by `recordStart` (coarse + fine / 255). Verify: `fxfades` starts at the held value.
- [x] 1.3 The fade factor: below 1, `writeTargetBlend`; at 1, `writeTarget`. Verify: the 50 ms
  check passes, and the values ramp over the Fade In.
- [x] 1.4 The `FX.cue` override: Relative start, release with `IDLE` at once, re-cue while
  releasing, Absolute unchanged. Verify: the `fxfades` checks.

## 2. Engine: fades on every cue (models/DMX)

- [x] 2.1 Move the fades from `FX` to `Cue`:
  - `fadeIn` / `fadeOut`, `buildFade`, `fadeInMS` / `fadeOutMS`;
  - the runtime fields, `computeFadeFactor`, the `cue` override, `endRelease`, `resetFade`;
  - `showData`;
  - a `fades` getter (`Scene` always, `FX` when `relative`).
  `FX.update` reads `fadeFactor` instead of computing it. Verify: `fxfades` still passes.
- [x] 2.2 Scene:
  - a Fade In without a duration takes the saved `duration`, else 0;
  - `update(t)` blends from the start (Relative) or 0 (Absolute) with `fadeFactor`;
  - no One Shot end, so it holds;
  - drop `direction` and the `!state && relative` hack.
  Verify: in the app, a scene fades in, holds, and fades out to 0 (Absolute) or to the other
  scene's values (Relative). The demo show's scenes fade in as before.
- [x] 2.3 Chase:
  - `Cue.itemFades(lengthMS)` gives `{ in, out }`, shrunk in proportion when they don't fit;
  - `Cue.playItem(t, lengthMS)` records the start on entering (Relative) and sets the factor
    from the item's timeline;
  - `CueItem.update` calls it;
  - `Chase.update` tracks each item's `active` flag, plays the item's end once on leaving it,
    and drops the `state = 0` writes.
  Verify: in the app, a chase with a scene item and a Relative effect item fades both in and
  out by their own times, and stretching an item only lengthens the hold.

## 3. UI (views)

- [x] 3.1 `ModifierWidgetCurve` gets a `timed` prop: a Bars field beside Type, 0 to 64.
- [x] 3.2 The effect fragment shows the Fade In and Fade Out widgets first, only in Relative.
- [x] 3.3 Cue Settings hides Duration and Loop Style for scenes. The scene fragment shows the
  Fade In and Fade Out widgets with `timed`. Verify: a scene shows both widgets with Bars and
  no Duration, and an effect still shows Duration.
- [x] 3.4 The cue pool tile's progress for a scene follows its fade-in, and is full while it
  holds. Verify: start a scene with a 2-bar Fade In; the tile fills over 2 bars and stays full.
- [x] 3.5 The chase timeline draws each item from `itemFades`: the Fade In curve, a flat hold,
  the Fade Out curve; a flat line when the cue doesn't fade. Verify: stretching an item keeps
  its ramps the same width.

## 4. Checks

- [x] 4.1 `app:check` scenario `fxfades` (effects standalone).
- [x] 4.2 Extend `fxfades`:
  - a scene holds after its Fade In and fades out to 0 (Absolute) or back (Relative);
  - an older scene takes its Duration as its Fade In;
  - Cue Settings has no Duration for a scene;
  - a chase item fades by its cue's times, and stretching it keeps them;
  - a short item shrinks both fades;
  - the item preview's ramp widths match `itemFades`.
  Verify: `--only fxfades` passes, then the full run.

## 5. Docs and AI context

- [x] 5.1 Manual:
  - `programming/scenes.md`: Cue Settings without Duration for scenes, How a scene fades (Fade
    In / Out, hold, stop);
  - `programming/effects.md`: Fading in and out, including chases;
  - `programming/chases.md`: items start and end their cues, the fades in the item;
  - `concepts/timing.md`: where Duration still applies;
  - presets `cue-settings`, `scene-curve` (timed) and `effect-fade`.
  Verify: `npm run docs:manual:check` passes for those pages.
- [x] 5.2 AI context: in `src/models/DMX/CLAUDE.md`, describe fades on `Cue`, `playItem` and
  scenes holding. Verify: it reads correctly against the code.
- [x] 5.3 `npx eslint` on all touched files is clean.
