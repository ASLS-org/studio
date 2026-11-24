# Design

## Context

See proposal.md (Why). What the code does today:

- `fade.model.js`: `FADE_PRESETS` (CUSTOM, LINEAR, EASE, EASE_IN, EASE_OUT, EASE_IN_OUT) and
  `FADE_PRESETS_INDICES` in that order; a showfile stores `type` (the index) and
  `controlPoints`. `set type` copies a preset's points; `set controlPoints` makes it custom (0).
  The picker lists `availabelEasingFunctions` (the raw keys).
- `getValue(time, duration)` sets `t = time / duration` and returns the Bézier `y(t)`, with `x(t)`
  stored but unused: time is read as the curve parameter. For *Ease in* at half time this plays
  100 of 200 where the drawn curve says 63. The play dot (`pointAt(t)`) sits at `(x(t), y(t))`, so
  it is on the curve but not at the current time.
- `scene.model.js` update multiplies channel values by `fade.getValue()` and writes them with
  `setQuickAccessor`; nothing clamps, and the universe packs `channel.value.DMX` into a
  `Uint8Array(512)`, where 270 wraps to 14.
- `modifier.widget.curve.vue`: a `uk-select-input` of keys, CP X/Y fields with `max 1`, a 190×189
  canvas mapping 0–1 to its full height, drag clamped to 0–1. The chase timeline draws each
  cue's fade in curve from its control points.
- The manual's `SceneFade.vue` already solves the curve by time (its own `ease(x)`).

## Goals / Non-Goals

**Goals:** playback as drawn, 24 presets with names, a searchable picker, overshoot.

**Non-Goals:** fade out curves; multi-segment curves (steps, bounce, elastic); thumbnails.

## Decisions

- **Solve for time:** `getValue(time, duration)` takes `x = time / duration` clamped to 0–1 and
  finds `t` with `x(t) = x`: Newton steps from `t = x` (up to 8, while the slope is above 1e-6),
  then bisection on 0–1 if not within 1e-5. `t`, `x` and `value = y(t)` are kept as now, so
  `pointAt(this.t)` places the dot at the current time. Plain numbers, no allocation (hot path).
  Alternative: a lookup table per curve; rejected, since curves change while editing and a
  solve is cheap.
- **Presets:** `FADE_PRESETS` keeps its six keys and order; the 24 new ones are appended
  (`SINE_IN`, `SINE_OUT`, `SINE_IN_OUT`, … `BACK_IN_OUT`) with the easings.net cubic-bezier values
  (e.g. Sine in 0.12, 0 / 0.39, 0; Expo out 0.16, 1 / 0.3, 1; Back in-out 0.68, −0.6 /
  0.32, 1.6). `FADE_PRESET_NAMES` gives each index a name (*Custom*, *Linear*, *Ease*,
  *Ease in*, …, *Back in-out*). `availabelEasingFunctions` is replaced by a `presetNames` getter
  (the old name is not used elsewhere).
- **Picker (revised after review):** a standard `uk-select-input`; each option is an inline
  14 px SVG of the preset's curve (drawn in the text colour, with the canvas' headroom) and its
  name, so the box shows the current curve too. *Custom* draws the fade's own points. `v-model` on
  `fade.type`.
- **Overshoot:** CP Y fields `min −1`, `max 2`; drag clamps Y to −1–2. The canvas maps values
  −0.25 to 1.25 to its height (0 and 1 are drawn as dashed guides), so overshooting curves stay
  in view; control point handles beyond that range sit on the edge. The chase timeline keeps its full-height cue shapes (a filled area from the
  bottom to the top right): an overshoot is clipped by the cue's box, since headroom would leave
  every cue short of its top.
- **Clamp output:** the scene's update clamps each computed value to 0–255 before writing it
  (`value < 0 ? 0 : value > 255 ? 255 : value`, no allocation). Fades within 0–1 are unaffected.

## Risks / Trade-offs

- [Existing non-linear fades change timing] → Accepted by the user; they now match their curve.
  Starts and ends are unchanged.
- [The 0–1 band takes 2/3 of the canvas] → Room for overshoot; the guides mark 0 and 1.
- [Newton can stall on flat x(t)] → Bisection fallback always converges.

## Migration Plan

None: type indexes and control points load as before.

## Open Questions

None.
