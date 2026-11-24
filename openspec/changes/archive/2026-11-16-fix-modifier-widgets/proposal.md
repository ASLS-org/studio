# Proposal

## Why

Several modifier widgets get in the operator's way:

- A universe's ID can be typed over, but an open output keeps sending to the old number.
- The fixture pool is 250 px wide, so most fixture names and addresses are cut.
- The effect tool's *Phase start* and *Phase stop* run into the wave canvas.
- The fade editor's play dot drifts off the curve and jumps back at the end of a fade.

Unit 4 of epic `ui-ux-stabilization`.

## What Changes

- **Universe ID is fixed:** shown as a disabled field, set when the universe is created.
  **BREAKING** (behaviour only): the ID can't be edited any more.
- **Fixture pool fits its rows:** it widens to show rows whole, from 250 px up to 400 px.
- **Effect tool fields stay clear of the canvas,** with or without the PWM *Width* field.
- **Fade play dot follows the curve** for the whole fade and stays at its end.
- Removed: the unused fade editor copy (the manual's `scene-curve` preview mounts the real one)
  and the universe renumbering code.

## Out of scope

- Choosing the output's Art-Net/sACN universe number apart from the ID (a later candidate).
- The fixture address. It becomes read-only together with the repatch popup (unit 7).
- Fade curve presets (unit 6), effect scopes (unit 9), channel presets and icons (unit 5).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `patching`: a universe's ID is fixed, replacing "Universe id edits keep their fixtures".
- `uikit`: the fixture pool fits its rows; widget fields stay inside their widget; the list
  scenario about changing a universe's ID goes.
- `scenes`: the fade editor's play dot follows the curve.

## Impact

- Code: universe settings, fixture pool, effect and fade widgets; `universe.pool.model.js`,
  `view.state.js`; the manual's `presets.js`; `check-app.mjs`.
- Showfile format: none. Saved universe IDs load as before.
- Unsaved marker: none.
- Live playback/timing: none (the dot is display only).
- WSC output: none. Each universe keeps sending to its ID.
- Visualizer: none.
- Web vs Electron: same.

Manual:
- `programming/patching` (universe settings table: ID is read-only);
- `programming/scenes` (`scene-curve` preview);
- `npm run docs:manual:check`, since the universe settings, fixture pool, effect tool and fade
  previews change.
