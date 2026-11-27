# Design

## Context

- `Cue` (cue.model.js) owns standalone playback:
  - `cue(true)` registers `_update` with `Live.add` and sets `RUNNING`;
  - `cue(false)` removes it;
  - `_update(t)` passes the time since the cue to `update(time)` and ends a One Shot cue after
    `durationMS`.
- `Scene.update(time, duration)`:
  - fades over `duration` (its Duration, or the chase item's length);
  - records start values when `!state && relative` (a hack the chase leans on by setting
    `state = 0`);
  - has a `fadeOut` that is never used.
- `FX.update(t)` loops over `t % durationMS`. Each `FXChannel` writes its fixtures' targets
  (`{ cell, direct, inverted, phase }`) through `writeTarget`.
- **Already built in this change (effects):**
  - `FX.fadeIn` / `fadeOut` with `duration` in bars;
  - per-target `start` arrays and `recordStart`;
  - `writeTargetBlend`;
  - `computeFadeFactor`;
  - the `cue` override with release.
- `Chase.update(time)` calls, for each item under the playhead, `item.update(t - itemStart)`, which
  calls `cue.update(t, lengthMS)`. It never calls `cue()`. Leaving an item only sets the cue's
  `state = 0`.
- The chase timeline (`computeCueItemCurve`) draws `fadeIn`'s curve across the whole item.

## Goals / Non-Goals

**Goals:**
- One fade model for scenes and effects, standalone and in chases.
- Fade times independent of item length.
- Older shows load and play their scenes' fade-in as before.

**Non-Goals:**
- Priorities between cues.
- Fades for Absolute effects.
- Fading out when a whole chase is stopped.

## Decisions

**1. Fades move to `Cue`.**
- `Cue` gets:
  - `fadeIn` / `fadeOut` (`Fade`, `duration` in bars);
  - `fadeInMS` / `fadeOutMS`;
  - the runtime fields `elapsed`, `fadeFactor`, `fadeStart`, `releasing` and `releaseFrom`;
  - `computeFadeFactor(t)`, the `cue(state)` override with release, `endRelease` and
    `resetFade`.
  - These are the code already written for `FX`, moved up.
- A getter `fades` says whether this cue fades:
  - `Scene`: always;
  - `FX`: only when `relative`.
- `showData` saves `fadeIn` / `fadeOut` as `{ type, controlPoints, duration }`.
- Load (`buildFade`):
  - a scene's Fade In without a duration takes `data.duration` (the old fade time), else 1 bar
    for a new scene;
  - every other missing time is 0.
- Cued again while fading out, a cue fades in from the factor it had reached (`fadeFrom`), so
  nothing jumps in Absolute or Relative, without recording the start values again.
- A new chase item for a scene is long enough for its fades (a bar at least); an effect's item
  still gets its Duration.

**2. Scenes write with the factor.**
- `Scene.update(t)` blends `from + (value - from) * fadeFactor`.
  - `from` is the recorded start in Relative, 0 in Absolute.
  - A release then goes down to 0 in Absolute and back to the start in Relative.
- Values are still clamped to 0–255.
- A scene ends by itself once faded in (`endMS` = `fadeInMS`), and its look stays. It doesn't fade
  out at that end (`fadesOutAtEnd` is false); its Fade Out plays when it is stopped before. A One
  Shot effect with a Fade Out fades out at the end of its Duration.
- `prepareStartValues` stays as it is (`channel.startValue`).
- The `direction` field and the `!state && relative` hack go away.

**3. Chases play items through the cue.**
- `CueItem.update(t)` calls `cue.playItem(t, lengthMS)`.
- `Cue.playItem`:
  - **Entering:** on the item's first tick (the item wasn't active, or `t` went back on a loop),
    it records the start values when `relative`.
  - **Factor:** while `fades` holds, the factor comes from the item's own timeline:
    - `k = min(1, lengthMS / (fadeInMS + fadeOutMS))`, `in = fadeInMS * k`, `out = fadeOutMS * k`;
    - `t < in`: `fadeIn.getValue(t, in)`;
    - `t > lengthMS - out`: `1 - fadeOut.getValue(t - (lengthMS - out), out)`;
    - else 1.
  - It then calls `update(t)`.
  - The standalone `cue()` state (`animationId`, `releasing`) is not touched.
- `Chase.update`:
  - keeps a runtime `active` flag on each item;
  - when an active item stops being under the playhead, it plays the item's end once
    (`playItem(lengthMS, lengthMS)`), so the Fade Out ends exactly at 0 or at the start values.
  - The `state = 0` writes go away; `chaseActive` stays for the play indicator.
- `computeFadeFactor` (standalone) and `playItem` (chase) both set `fadeFactor`, and each
  subclass's `update(t)` writes with it. `FX.update` no longer computes the factor itself.

**4. UI.**
- Cue Settings hides **Duration** and **Loop Style** for scenes (`cue.type === 0`).
- The scene fragment shows the Fade In and Fade Out curve widgets with `timed`, in place of the
  single untimed Fade In.
- The effect fragment shows them when Relative, as now.
- The cue pool tile's progress:
  - for a scene, it is the fade-in's progress (`elapsed / fadeInMS`), full when held;
  - for effects it is unchanged.
- The chase timeline draws, in item pixels, the Fade In curve over `in`, a flat line to
  `length - out`, and the Fade Out curve over `out` (the same `k`).
  - The curve is drawn by mapping the fade's control points into each segment, and its Y is
    inverted for the fade-out.
  - When the cue doesn't fade, it draws a flat line across the item.
  - `k`, `in` and `out` come from one shared helper on `Cue`, `itemFades(lengthMS)`, so the
    preview and playback can't disagree.

## Risks / Trade-offs

- **Held scenes keep writing every tick**, where before they stopped after their Duration. That
  is a per-channel write per tick for each held scene, the same cost as during a fade.
- **Several held cues on the same channels:** the last write wins, as today. Priorities are a
  separate change.
- **Older shows:** a scene that used to end after its Duration now holds until stopped. Its look
  is the same, since the values stayed before too, but its tile stays lit.
- **Chase timing:** fades follow the chase's own time, not Live time, so they stay in sync with
  the playhead.
