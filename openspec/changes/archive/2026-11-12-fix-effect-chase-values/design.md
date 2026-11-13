# Design

## Context

- **Effect channels.** `FXChannel` (`src/models/DMX/effect.model.js`) computes each value in
  `getValue(t, phaseOffset)`.
  - `t` is the effect's progress, from 0 to 1 over its duration. `FX.update` passes it as
    `percent`, and `frequency` is the number of cycles per duration.
  - `getValue` has no case for `PWM`, so it returns 1.
  - `slotPhase()` has no case for `BOUNCELRT` or `BOUNCERTL`, so it returns 0. An unused
    `directionFlag` field is the only trace of a bounce plan.
- **The effect tool.** `group.effect.modifier.widget.wave.vue` draws the curve from
  `channel.getValue(t)`, so any change to `getValue` shows up in the curve as well.
- **Chases.**
  - `Chase` (`chase.model.js`) sets `this.quantize = 4` in its constructor and leaves it out of
    `showData`.
  - The chase panel binds a select (`['None', '1/8', '1/4', '1/2', '1/1']`) to `chase.quantize`,
    so it stores the option index.
  - `Live.add(fn, quantize)` takes that index as a number of beats. It swaps the real update in
    when `(t / beat) % q` lands in `[q - 1, q - 0.9]`, which is the last beat before a q-beat
    boundary, not the boundary itself.

## Goals / Non-Goals

**Goals:**
- PWM, the bounce directions and quantize do what their labels say.
- Older showfiles load with the same results they had, and aren't marked unsaved.

**Non-Goals:**
- Time signatures other than 4/4.
- Changing what a chase does once it has begun.
- Removing `effect.preset.model.js`.

## Decisions

### D1. PWM: compare the cycle position with the width
Proposed code:
`cyc = frac(frequency * t + (phaseRad + phaseOffset) / 2π)`, and the value is
`cyc < width / 100 ? max : min`.

- **Width:** a new `FXChannel.width` (default 50, clamped to 1–99), saved in `showData` and read
  in the constructor with `channel.width ?? 50`.
- **UI:** a `uk-num-input` "Width" (min 1, max 99), shown with `v-if` when the waveform is
  `PWM`. It goes in the effect tool's first column, next to **Phase**.
- **Square stays as it is:** **SQUARE** keeps its own formula (sine ≥ average). At 50 %, PWM is
  that same square shifted by a quarter cycle, and nothing in a saved show depends on the shift.
- **Alternative considered:** reusing **SQUARE** with a duty argument. Rejected, because it would
  change existing **SQUARE** shows.

### D2. Bounce: ping-pong the effect's time, LTR or RTL spread
- **Spread:** `slotPhase()` treats `BOUNCELRT` as `LTR` and `BOUNCERTL` as `RTL`.
- **Time:** in `getValue`, for those two directions, the time fed to the wave is folded:
  1. `u = frequency * t` (cycles elapsed);
  2. `k = floor(u)`;
  3. `f = u - k` (position in the current cycle);
  4. `p = k even ? f : 1 - f`, so the position runs backward on odd cycles.

  The wave is evaluated at cycle position `p` (as at time `p / frequency`), so its shape is the
  same both ways. Running time backward reverses the direction of travel and keeps every value
  continuous at the turn, since both sides meet at `p = 1`, then at `p = 0`.
- **The curve:** the effect tool draws the folded curve, which shows the bounce.
- **Alternative considered:** flipping the sign of the phase spread every cycle. Rejected,
  because every fixture jumps at the flip.

### D3. Quantize: store the index, convert to beats, start on the boundary
- **Saved value:** `Chase` keeps the option index (the select's v-model), reads
  `data.quantize ?? 4` and adds `quantize` to `showData`.
- **Beats:** a `CHASE_QUANTIZE_BEATS = [0, 0.5, 1, 2, 4]` table maps the index to beats, and
  `Chase.cue` passes `CHASE_QUANTIZE_BEATS[this.quantize]` to `Live.add`.
- **`Live.add` with `q` beats:**
  - It stores `qMs = q * beatDuration` and `first = floor(t0 / qMs)`.
  - On each tick it swaps the update in once `floor(t / qMs) > first`.
  - Under the 60 Hz tick, a chase begins at most about 17 ms late.
- **The one-beat-early start:** whether it was meant (for example to absorb UI latency) is
  checked in the app during apply, against the toolbar's bar counter, before it's removed. If it
  turns out deliberate, D3 is revised with the user first.
- **Per-tick cost:** one division, one floor and one comparison per quantized animation while it
  waits. No allocation.

## Risks / Trade-offs

- **BPM changes during the wait:** if the BPM changes while a chase waits, the boundary is
  counted with the new beat length. That's acceptable, since the wait lasts at most one bar.
- **Time and BPM drift:** if Live's time doesn't restart at a bar line (for example after a BPM
  change while playing), "boundary from the clock start" drifts from what the toolbar shows. The
  apply step checks both against each other.
- **Unsaved marker:** older shows gain `width` and `quantize` in `showData` on load. The save that
  ends `loadFromData` takes them in, so the unsaved marker stays clear.
