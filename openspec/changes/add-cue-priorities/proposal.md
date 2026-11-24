# Proposal

## Why

When cues share channels, the last one Live runs wins, not the one started last: chase items
lose to older cues, ended scenes lose their look, and a stopped cue snaps to whatever comes next.
Consoles use a merge engine instead: priorities, HTP/LTP, tracking, release fades, defaults.

## What Changes

- **Priority per cue:** Low, Normal (default), High or Top, set in Cue Settings.
- **Intensity mode per cue:** HTP (default) or LTP for its Dimmer channels.
- **Each channel is settled once per tick:**
  - a higher priority wins;
  - at equal priority, an HTP cue's Dimmer takes the highest value;
  - every other channel goes to the cue started last (LTP).
  "Started" is when a cue is triggered, or when the chase playhead enters its item. Live's order
  no longer matters.
- **Fades blend with what is underneath:**
  - a cue fading in or out mixes with the live value of the cue below it, even a moving effect;
  - Relative fades from that value, Absolute from 0;
  - a stopped cue crossfades into what is underneath over its Fade Out, instead of jumping.
- **Defaults:** a channel nothing drives any more fades to its default (Dimmer 0, Pan/Tilt
  centre, the profile's home value) over the releasing cue's Fade Out.
- **Ended scenes keep their look:** a cue with a higher priority, or one started later, takes
  their channels; an older one doesn't.
- **Release** in the master column (in place of its unused Isolate) lets go of every held look.
  Their channels go to what still plays, else to defaults.

## Capabilities

### New Capabilities

- `playback`: how cues share channels: priorities, merge, fades with what is underneath,
  defaults, held looks, Release.

### Modified Capabilities

- `effects`, `scenes`, `chases`: fades blend with the live value underneath, not values recorded
  at the start; released channels go to what is underneath, else defaults.

## Impact

- **Showfile:** cues save `priority` and `intensityMode`. Older shows load as Normal / HTP. Claims
  are never saved.
- **Behaviour:** a stopped Absolute cue fades into what is underneath, not to 0, unless nothing
  is.
- **Live:** a few comparisons per write; the settle pass touches only written channels. No
  allocation per tick.
- **WSC output, visualizer, web vs Electron:** none.

## Out of scope

- Programmer, Clear, Park, channel source (`add-programmer`).
- Group masters (`wire-group-masters`).
- HTP on colour.

Manual: `concepts/timing.md` (What Plays Together), `programming/playback.md`,
`programming/scenes.md` (Cue Settings, fades), `programming/effects.md` (fades),
`reference/glossary.md`; previews `cue-settings`, `group-cuepool`.
