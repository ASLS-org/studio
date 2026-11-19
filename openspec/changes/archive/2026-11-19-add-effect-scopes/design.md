# Design

## Context

- `FX` holds `FXChannel`s (one per type), each with its own `FXFixture` list (`phase` in radians,
  `active`) and `getValue(t, phase)`, pure for `t` in 0-1 over the loop (whole cycles per loop).
  `slotPhase(index, n, start, span)` gives a fixture's phase from the direction. Wave setters
  rephase; the Effect Tool binds them with `v-model`. `FX.addChannel(data)` adds a wave.
- A fixture's profile mode channels (`fixture.mode.channels`) carry capabilities whose
  `entities.pan` / `entities.tilt` have `start`/`end` in degrees (the visualizer's `angleCenter`
  reads them the same way).
- Live values come through `live.mixin.js` (25 Hz while playing).

## Goals / Non-Goals

(One engine addition after review: a channel's `mirror`, see decision 18.)

**Goals:** read the combined result in true geometry; shape it precisely by dragging, typing or
presets that never leave traces; no model or showfile change; nothing on the engine tick.
**Non-Goals:** per-cell rows, list hover, waveforms the engine doesn't have.

## Decisions

1. **Widgets** `group.effect.modifier.widget.scope.pantilt.vue` and `.scope.colour.vue`, before the
   Effect Tool, shown for the selected modulated channel's type (and only with their waves).
   Maths in `views/utils/effect.scope.js` (pure, raw waves). No editor popup: the widgets are
   readable at their size.
2. **Units.** Waves stay in DMX. The Pan/Tilt view maps DMX → degrees per axis:
   `deg = v / 255 × range − range / 2`, range from the first active fixture's profile (fallback
   540/270). The view is square in degrees (Degrees) or DMX (DMX), fit on the path's box ± 25 %
   (Fit) or the whole range; grid step from 1/2/5/10/15/30/45/90° or 2/4/8/16/32 DMX, the smallest
   giving ≤ 12 lines. Fields read and write in the view's unit, converted to DMX.
3. **Readable at any size.** The SVG uses `preserveAspectRatio` with no padding; grid labels, the
   readout and dot numbers are HTML overlays positioned from the SVG's screen matrix at
   `--font-xs`/`--font-sm`. Dots are drawn at a fixed pixel radius with a ≥ 8 px invisible hit
   circle; handles likewise, just outside the box. Colour row numbers sit on the rows (a chip),
   no gutter.
4. **Shapes and presets are absolute.** A shape = `{ pan, tilt }` each `{ waveform, ratio,
   offset }` or `flat`; applying sets waveform, Freq = ratio × Speed, Phase = offset, width 50,
   keeps the centre, and sets the size from the widget's remembered size per axis (updated
   whenever a size is non-zero), so lines don't lose it; round shapes take equal degree sizes
   (the larger). Speed = gcd of the waves' Freq; setting it scales them. Colour presets set, per
   colour wave: waveform, Min, Max (from Colour A/B or fixed colours), Phase, width, Freq =
   multiplier × Speed, direction and Phase start/stop; other colour waves flat at 0.
5. **Spread patterns** set direction (`directionOptions` names) and Phase start/stop on the
   scope's waves: Together 0/0, Wave LTR 0/360, Reverse RTL 0/360, Mirror SYM 0/360, Half LTR
   0/180, Bounce BOUNCELRT 0/360.
6. **Drags** as before (snapshot at press, snapped deltas; dot drag unwraps from the last pointer
   position; colour drags follow the pointer, 15° snap), deltas computed in the view's unit and
   converted to DMX.
7. **Shapes computed, not played:** 96 samples per loop per fixture, recomputed on a shape key;
   paths deduplicated when one is the other shifted in time (`samePath`); the live tick only
   moves dots and the playhead.

10. **Colour A and B are read from the waves**, not kept by the widget: A mixes every colour
    wave's Min, B every Max (`mixColour`); an `<input type="color">` writes red, green and blue
    at that end (adding missing waves) and 0 to the other colour waves there. Every preset runs
    its waves from A (Min) to B (Max), applied with its `defaults` (palette names, plus white and
    black), so any effect, preset or not (Rainbow: black to white with hue offsets), shows and
    edits its colours the same way. A Width field shows while any colour wave is PWM.
11. **Channels:** the Modulated Channels widget reads `effect.listableChannels` as a computed (it
    kept a copy, so added waves didn't show) and follows the panel's selected channel; the panel
    keeps its first channel selected when the selected one is gone.

12. **Colour Scope layout:** the strip, then rows (Preset and Spread, half and half; Colour A,
    Colour B, Speed; Phase, Phase start, Phase stop; Width for PWM); the hover readout is a strip
    over the field's bottom; a preset's description is its tooltip.
13. **`uk-color-input`** (`uikit/inputs/color`): `v-model` `#rrggbb`; a swatch over a hidden
    native `<input type="color">` (live while dragging) and a hex text box (Enter/blur, invalid
    text reverts), the textbox look of `uk-txt-input`.
14. **Add Modulated Channel popup** lists `availableChannels(effect)` (scope maths): per
    fixture channel not fine, its colour for colour-mixing attributes else its `kind`, with
    `channelIcon`; in-use ones say so and can't be picked; OK calls `FX.addChannel({ type })`
    per pick and the channels widget selects the first.

15. **Derived selects:** `matchShape(pan, tilt)`, `matchSpread(waves)` and
    `matchColourPreset(waves)` (scope maths) compare the waves with each item (waveforms, Freq
    ratios, phase offsets, flat axes, round sizes; direction and Phase start/stop; for presets
    the waves rebuilt from the current A/B). The select shows the last picked item while it
    still matches, else the first match, else Custom (an extra last option that does nothing).
16. **Layout:** fields at a fixed width, drawings on their left; the scopes sit between Channel
    Fixtures Activity and the Effect Tool. View switches are square `uk-button toggleable`
    (accent colour, keyed by state): Deg and Fit stacked at the start of the bottom row.
17. **Pan/Tilt drawing:** no grid values in the plot (the corner readout gives pan/tilt under the
    pointer and the grid step). Shared path → queue: path once, fixture 1 lit and numbered, the
    others faint unnumbered dots, and an arc over the path from the lead back to the last
    fixture, from their pan phase lags `(φk − φ1) / (2π·fPan)` (redrawn on the live tick).
    Different paths → fixture 1 lit, the rest faint. Dots are not draggable (the spread is set
    with Phase start/stop and Spread); a press on one moves the shape. The box has edge handles
    (one end) and corner handles (one end of each axis).

18. **Mirror (engine):** `FXChannel.mirror` (saved, default false) marks, in
    `computeFixturesPhasing`, the active fixtures past the middle (`i > (n − 1) / 2`) as
    `FXFixture.mirrored` (runtime); `update` writes `min + max − value` for them (cells too), the
    sum computed once per tick. Flipping the value, not adding 180° of phase, is exact for every
    waveform. The Mirror spread sets SYM on both waves and `mirror` on Pan only (a left-right
    mirror flips pan, not tilt); `valueAt` flips mirrored entries so the scopes draw them where
    they play.

## Risks / Trade-offs

- Fixtures with different ranges in one effect are drawn with the first one's.
- Dot drag with different Pan/Tilt Freq keeps the shape only when the starts are in proportion.
