# Tasks

## 1. Engine (models/DMX)

- [x] 1.1 `FXChannel`: add `width` (default 50, clamped 1–99) read with `channel.width ?? 50`,
  saved in `showData`, and a `PWM` case in `getValue` (design D1). Verify: an effect on Dimmer
  with PWM at 25 % lights a quarter of each cycle in the visualizer.
- [x] 1.2 `FXChannel`: bounce directions, `slotPhase` treats BOUNCELRT/BOUNCERTL as LTR/RTL, and
  `getValue` folds the time on odd cycles (D2). Verify: 4 fixtures, sine, 0–360°, BOUNCELRT: the
  brightest point runs first to last, then back, with no jump.
- [x] 1.3 `Chase`: read `data.quantize ?? 4`, save `quantize` in `showData`, and map the index
  to beats with `CHASE_QUANTIZE_BEATS` when cueing (D3). Verify: set 1/4, save, reload: still
  1/4. Opening the demo show doesn't mark it unsaved.
- [x] 1.4 `Live.add`: start quantized animations on the next boundary of `q` beats (D3). First
  check the old one-beat-early start against the toolbar's bar counter, and ask before
  changing it if it looks deliberate. Verify: at 120 BPM, a chase on 1/4 begins on the next
  beat and one on 1/1 on the next bar of the toolbar clock; None begins at once.
- [x] 1.5 Update `src/models/DMX/CLAUDE.md` (the `Live.add` quantize line: beats may be fractions,
  starts on the boundary).

## 2. UI (views)

- [x] 2.1 Effect tool (`group.effect.modifier.widget.wave.vue`): a **Width** number input
  (1–99), shown only while the waveform is PWM, and the curve redraws on width changes (add
  `width` to the redraw key). Verify: switching PWM ↔ SINE shows and hides it; dragging Width
  reshapes the curve.

## 3. Docs

- [x] 3.1 Manual: `programming/effects` (PWM and Width, bounce directions; remove the note),
  `programming/chases` and `programming/playback` (Quantize values), `concepts/timing`,
  `reference/glossary` (Quantize), `reference/limitations` (remove the three rows). Presets
  `effect-wave`, `chase-modifier`, `chase-play`, `master-row`. Verify in
  `npm run docs:manual:serve`, then `npm run docs:manual:check` passes.
- [x] 3.2 Remove the PWM, bounce and quantize entries from the backlog in
  `openspec/epics/manual-overhaul.md`.

## 4. Check

- [x] 4.1 `npx eslint` on all touched files is clean.
