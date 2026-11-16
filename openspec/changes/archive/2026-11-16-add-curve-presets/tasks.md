## 1. Engine (models/DMX)

- [x] 1.1 `Fade.getValue` solves the curve for time (Newton, bisection fallback, no allocation).
  Verify: a Node bundle prints *Ease in* at x = 0.5 as 0.315 (±0.002), *Linear* at 0.5 as 0.5,
  and every preset's value at x = 0 and 1 as 0 and 1.
- [x] 1.2 Append the 24 presets and `FADE_PRESET_NAMES`; `presetNames` replaces
  `availabelEasingFunctions`. Verify: indexes 0–5 hold the same points as before; a fade loaded
  with `type: 5` reads *Ease in-out*.
- [x] 1.3 Scenes clamp each fade output to 0–255. Verify: a *Back out* scene to 255 never writes
  above 255 (no wrap in the universe frame).

## 2. UI (views)

- [x] 2.1 Curve widget: the type is a standard select whose options show each preset's curve
  (inline SVG) and name. Verify: open it: 30 options with curves, the current one in view; pick
  *Expo out*: points read 0.16, 1 / 0.3, 1, the box shows its curve, `*` appears; drag a point:
  type reads *Custom*.
- [x] 2.2 Overshoot: CP Y −1 to 2 (fields and drag), canvas range −0.25 to 1.25 with dashed 0/1
  guides (the chase timeline keeps its
  full-height cue shapes, overshoot clipped). Verify: *Back in-out* shows its dip and
  peak inside the canvas; the play dot stays on the curve.

## 3. Checks and docs

- [x] 3.1 `app:check` scenario `curves`: preset select (30 names with curves, pick sets points
  and the unsaved marker), *Ease in* plays about 63 of 200 at half a bar, *Back out* never exceeds 255,
  the dot stays on the curve. Verify: passes, and the timing check fails on the old code.
- [x] 3.2 Manual: `programming/scenes` Fade in table (preset names, picker, Y range, playback
  follows the curve); `scene-curve` preview. Verify: `npm run docs:manual:check` all clear.
- [x] 3.3 AI context: `models/DMX/CLAUDE.md` (fades solve x for time; scene output clamped). Verify:
  it says so.
- [x] 3.4 `npx eslint` on all touched files is clean.
