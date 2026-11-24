# Proposal

## Why

- Effects start and stop at full strength, and Relative does nothing for them.
- A scene's Duration is its fade time, and scenes have no fade out.
- Chases write cues directly without starting or stopping them. So effects never fade, a scene's
  fade stretches over its item, nothing fades out, and the item preview draws the curve across
  the whole item.

## What Changes

- **Every cue gets a Fade In and a Fade Out:** each has its own time in bars (0 to 64, 0 = none)
  and the same 30 curves.
- **Effects fade only in Relative:**
  - they fade in from the channels' values and back to them when stopped, showing stopped at
    once;
  - cued again while fading out, they fade in from where the channels are;
  - in Absolute nothing changes.
- **Scenes:**
  - they lose **Duration** and **Loop Style**;
  - they fade in, then end with their look kept;
  - stopping one before that fades out, to 0 in Absolute or to the starting values in Relative.
- **Chases** start a cue when the playhead enters its item and end it with the item:
  - the Fade In plays from the item's start and the Fade Out ends at its end;
  - the length is the hold;
  - an item shorter than both fades shrinks them in proportion.
- **The chase item preview** draws the Fade In ramp, the hold, then the Fade Out ramp.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `effects`: effect fades in Relative mode.
- `scenes`: fade times of their own, hold, fade out.
- `chases`: items start and end their cues with the cues' fades; the item preview.

## Impact

- **Code:** cue models, chase, Cue Settings, fade widgets, chase timeline, `app:check`.
- **Showfile:** cues save `fadeIn` and `fadeOut` with their times.
  - An older scene takes its Duration as its Fade In, so it fades as before.
  - Older effects get 0.
- **Behaviour:** cues in chases fade by their own times, not their item's length.
- **Unsaved marker:** fade settings are saved; playback state isn't.
- **Live:** one factor per cue per tick, and one multiply per channel while fading. No
  allocation per tick.
- **WSC output, visualizer, web vs Electron:** none.

## Out of scope

- Priorities between cues driving the same channels (separate change).
- Fades for Absolute effects.
- Fading cues out when a whole chase is stopped.
- Group masters, Blackout and Isolate (`wire-group-masters`).

Manual: `programming/effects.md`, `programming/scenes.md`, `programming/chases.md`,
`concepts/timing.md`; previews `cue-settings`, `scene-curve`, `effect-fade`, chase timeline.
