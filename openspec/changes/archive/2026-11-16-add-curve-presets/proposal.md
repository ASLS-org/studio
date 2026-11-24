# Proposal

## Why

A scene's fade has five presets (Linear, Ease, Ease in, Ease out, Ease in-out), picked from a
select showing raw keys (`EASE_IN_OUT`). Common lighting moves (a slow sine swell, a sharp expo
snap, a fade that overshoots and settles) mean hand-dragging control points. Worse, playback
doesn't follow the drawn curve: it reads the Bézier parameter as time, so every curve but Linear
plays with other timing than it shows.

## What Changes

- **Playback follows the curve:** at a time fraction `x`, the fade solves the curve for the point
  at `x` and plays its value, as CSS easing does. What is drawn is what plays.
- **Presets:** Sine, Quad, Cubic, Quart, Quint, Expo, Circ and Back, each *in*, *out* and
  *in-out* (24 more), next to the existing five. Each has a readable name (*Cubic out*,
  *Ease in-out*); editing a point still makes the curve *Custom*.
- **Picker:** the type stays a standard select, each option with a small picture of its curve
  next to its name.
- **Overshoot:** a control point's Y may go from −1 to 2 (X stays 0 to 1), so Back presets and
  custom curves can overshoot. The editor shows the curve with headroom above and below; DMX
  output stays clamped to 0–255.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scenes`: fades play as drawn; fade presets and their picker; curves can overshoot.

## Impact

- Showfile format: presets keep their index (`type`); new ones are appended. Older files load
  unchanged, and an older app opening a new preset keeps its control points as *Custom*.
- Unsaved marker: picking a preset changes the scene like an edit does.
- Live playback/timing: non-linear fades of existing shows change timing slightly to match their
  drawn curve. Durations are unchanged. The per-tick solve allocates nothing.
- WSC output, visualizer: none beyond the values played.
- Web vs Electron: same.
- Code: `fade.model.js` (presets, names, solve), `scene.model.js` (clamp),
  `modifier.widget.curve.vue` (picker, headroom, Y range), `uk-select-input` (shared trigger box
  look), `app:check`.

**Out of scope:** fade out curves (the fade out widget stays hidden); steps or bounce/elastic
curves (they need more than one cubic segment); curve thumbnails in the list.

**Manual:** `programming/scenes` (Fade in table, overshoot), preview `scene-curve`.
