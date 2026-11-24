# Proposal

## Why

The Effect Tool shows one wave at a time: the result across the rig (the heads' shape, the colour
travelling across fixtures) shows only by playing the effect, and shaping it means guessing
numbers. Mirrored movements (heads as mirror images) can't be made at all.

## What Changes

- **Pan/Tilt Scope**: the path in degrees from the fixtures' profiles (or DMX), fixtures as a
  queue on a shared path, the first one lit. Drag or handle-resize the shape (grid snapping,
  Shift fine, arrow keys); Centre, Size, Speed, Phase fields; 17 absolute shapes.
- **Colour Scope**: a numbered row per fixture across one loop, playhead, hover readout,
  Colour A and B read from any effect's waves, 13 absolute presets, Speed/Width/Phase fields.
- **Spreads** on both (Together, Wave, Reverse, Mirror, Half, Bounce); the selects show what the
  waves are, or Custom.
- **Mirror** on a channel (Effect Tool): its second half of fixtures plays the wave flipped; the
  Mirror spread mirrors pan, so heads move as mirror images.
- **Add Modulated Channel** lists the fixtures' channels with icons instead of presets; each scope
  shows for the selected channel. A uikit colour field (`uk-color-input`).
- Scopes and the Effect Tool edit the same waves.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `effects`: seeing and shaping an effect's pan/tilt path and colour spread.

## Impact

- Showfile format: effect channels gain `mirror` (default off when missing): older showfiles
  load and play as before.
- Unsaved marker: scope edits mark the show unsaved, like Effect Tool edits.
- Live playback/timing: none; the scopes redraw on the 25 Hz live ticker, not the engine tick.
- WSC output, web vs Electron: none. Visualizer: none (it follows wave edits).

## Out of scope

- Per-cell rows; hover from Channel Fixtures Activity; free colour stops.
- Shapes needing new waveforms (squares, spirals) or per-fixture sizes.
- Scopes for other channel types (dimmer, gobo, zoom).

Manual: `programming/effects.md` (Pan/Tilt Scope, Colour Scope, presets tables), previews
`effect-pantilt-scope`, `effect-colour-scope`.
