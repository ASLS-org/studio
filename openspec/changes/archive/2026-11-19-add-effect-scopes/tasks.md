# Tasks

## 1. Maths (views/utils)

- [x] 1.1 `effect.scope.js`: angle ranges from profiles, unit mapping, view fit and grid steps,
  Speed (gcd), absolute shapes (≥ 14), spreads, colour presets (≥ 12) with Colour A/B, path
  comparison. Verify in Node (esbuild bundle): shapes in any order equal the last alone.

## 2. Pan/Tilt Scope (views)

- [x] 2.1 Degrees/DMX views, Fit/Full, labelled grid as HTML overlay, numbered dots with hit
  areas, hover. Verify: a Circle is round in Degrees on the demo heads.
- [x] 2.2 Drags, snapping, keys, handles outside the box. Verify: values in the Effect Tool.
- [x] 2.3 Fields Centre, Size (view unit), Speed, Phase start/stop. Verify: DMX Size pan 40.
- [x] 2.4 Shapes and spreads. Verify: Line H then Circle = Circle alone.
- [x] 2.5 Queue view (shared path: lead lit, faint queue, spread arc; else lead lit, rest faint),
  no dot drag, no grid values in the plot (hover readout), corner handles on the box. Verify:
  16 heads: one circle and its queue; the bottom-right corner moves pan high and tilt low.

## 3. Colour Scope (views)

- [x] 3.1 Rows with numbers on them, hover readout, playhead. Verify by hovering.
- [x] 3.2 (Lanes per colour wave: added, then removed at review.) Preset and Spread share the first
  row. Verify: their widths.
- [x] 3.3 Fields Phase, Speed, Phase start/stop; 15° drags. Verify in the Effect Tool.
- [x] 3.4 Colour A/B and ≥ 12 presets, spreads. Verify: Strobe then Fade = Fade alone.

- [x] 3.5 Colour A and B read from and written to the waves (any colour); presets run A to B
  from their defaults, one-line description; Width field for PWM. Verify: B orange on Rainbow,
  B indigo on Police, Chase Width 30.
- [x] 3.6 After the Effect Tool: Colour Scope, then Pan/Tilt; Modulated Channels list live.
  Verify: Rainbow adds Blue.

## 4. Channels and fields

- [x] 4.1 Remove the Expand editor. Colour Scope in rows of three,
  readout over the field. Verify: screenshot.
- [x] 4.2 `uk-color-input` in the uikit, used for Colour A and B. Verify: typing ff8000.
- [x] 4.3 Add Modulated Channel lists available channels with icons; OK adds and selects.
  Verify: adding Zoom on the demo heads.
- [x] 4.4 Scopes follow the selected modulated channel's type. Verify: Red → Colour Scope,
  Pan → Pan/Tilt Scope, Dimmer → none.

- [x] 4.5 Fields at a fixed width (colour strip left, pan/tilt field right), scopes before the
  Effect Tool; Deg and Fit as square lit toggles among the fields. Verify: a taller panel
  grows only the drawing.
- [x] 4.6 Shape, Spread and Preset selects derived from the waves, Custom otherwise. Verify:
  Strobe shows Together; Circle then a Tilt phase edit shows Custom.

- [x] 4.7 Engine: `FXChannel.mirror` (saved, default off), second half flipped; Mirror spread
  mirrors Pan; Effect Tool Mirror toggle and dashed flipped curve; scopes draw mirrored fixtures.
  Verify: SYM + Mirror on 4 heads, pans add to Min + Max; showData round trip.

## 5. Checks

- [x] 5.1 `app:check` `scopes` scenario covering the above, no block over 50 ms while playing.
  Verify: the scenario and the full run pass.

## 6. Docs

- [x] 6.1 Manual `programming/effects.md`: both scopes, shapes, spreads and presets tables,
  editor; previews. Verify with `npm run docs:manual:check`.
- [x] 6.2 AI context: views map, coverage map, epic row 9.
- [x] 6.3 `npx eslint` on all touched files is clean.
