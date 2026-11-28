# Proposal

## Why

A scene playing a 16-bit channel (a dimmer, pan or tilt with a fine channel) sends its fine byte
as 0: the scene saves both bytes, but playback keeps only the coarse one. Fades and positions on
16-bit fixtures lose their smooth steps.

## What Changes

- A playing scene sends each 16-bit channel as one value, coarse and fine together, so the fine
  byte reaches the output, fades blend at 16-bit resolution, and the masters scale both bytes.
- Effects and the programmer are unchanged (they already send one value).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `playback`: 16-bit channels play their fine byte.

## Impact

- **Code:** `Scene` (`FixtureValue` links each channel to its fine partner; `Scene.update`).
- **Showfile:** none (scenes already save both bytes).
- **Unsaved marker:** none.
- **Live:** one addition per 16-bit channel per tick, no allocation.
- **Output, visualizer:** both get the fine byte. **Web vs Electron:** none.

## Out of scope

- 24-bit channels (a second fine byte): only the first fine byte plays.

Manual: n/a, nothing users operate changes (the output gets the value the scene shows).
