# Proposal

## Why

Three effect and chase options don't do what their names say (the manual lists them as
limitations):

- The effect waveform **PWM** holds the channel at a constant 1, so the light stays dark.
- The effect directions **BOUNCELRT** and **BOUNCERTL** give every fixture the same phase, so the
  fixtures all move together.
- The chase **Quantize** options **1/8**, **1/4** and **1/2** wait 1, 2 and 3 beats. Quantize is
  also not saved: every chase is back on **1/1** after a reload.

## What Changes

- **PWM** becomes a square wave with a **Width** (1–99 % of each cycle at **Max**), a new
  field in the effect tool shown only for PWM. Older shows load at 50 %.
- **BOUNCELRT** / **BOUNCERTL** run the wave across the fixtures one way, then back (time runs
  forward one cycle, backward the next, so nothing jumps), starting left or right.
- **Quantize** waits for the next boundary of its note value at the show's BPM: **1/8** = half a
  beat, **1/4** = one beat, **1/2** = two beats, **1/1** = one bar (4 beats). **None** starts at
  once.
- Quantize is saved per chase. Older shows load at **1/1**, the value they always used.

## Capabilities

### New Capabilities
- `chases`: when a started chase begins (quantize) and that quantize is saved.

### Modified Capabilities
- `effects`: the PWM waveform with its width, and the bounce directions.

## Out of scope

- Group dimmer, **Isolate**, **Blackout**, master column controls (own change).
- Cue **Temporary**, patch bay **New** and delete, universe **Config** (separate change).
- New waveforms or directions, and time signatures other than 4/4.
- The unused `effect.preset.model.js` (marked for removal).

## Impact

- **Showfile:** each effect channel gains `width` (default 50) and each chase gains `quantize`
  (default 4, the **1/1** option). Older files load unchanged. No breaking change.
- **Unsaved marker:** changing **Width** or **Quantize** now marks the show unsaved, since both
  are part of the saved show.
- **Live playback and timing:** `Live.add` quantizes to fractions of a beat and starts on the
  boundary (it started one beat early); one division and a comparison per waiting tick.
- **WSC output, visualizer, web vs Electron:** none (output follows the channel values).

Manual: `programming/effects`, `programming/chases`, `programming/playback`, `concepts/timing`,
`reference/limitations`, `reference/glossary` (presets `effect-wave`, `chase-modifier`,
`chase-play`, `master-row`).
