# Proposal

## Why

Text that doesn't fit is cut or ellipsised, with no way to read it in place. Select inputs don't
show which option is chosen and can't be used from the keyboard. Spacings, sizes, font sizes and
radii are about 40 hard-coded pixel values across 63 components, plus about 40 one-off colours.
Neighbouring widgets drift apart, and changing the look means editing every file.

## What Changes

- **Overflowing text scrolls on hover.** Anywhere in Studio, hovering cut text for a moment scrolls
  it to its end, then back. Leaving resets it. It stays still with reduced motion.
- **Select inputs:**
  - the open list marks the current value;
  - ↑/↓ move through the options (and open the list);
  - Enter picks, Escape closes;
  - typing a letter jumps to the next option starting with it.
- **Panels resize from their whole border:** the modifier strip, the group pool's groups and the
  patch bay (up to twice its width), not only from a corner grip.
- **One design scale in `tokens.css`,** used by the app's styles:
  - spacing;
  - control and icon sizes;
  - font sizes;
  - radii;
  - border width;
  - colour roles for today's hard-coded colours.
- **Values snap onto the scale** (5 px becomes 4 px, 25 px becomes 24 px), so some gaps move by
  1 to 2 px.
- **Fixed geometry is never part of the scale.** Cue grid tiles, chase rows and widths that the code
  computes with keep their values. A fixed value used in several places gets its own variable, so
  changing the scale can't move it.
- Unused tokens (`--test`, `--some`) are removed.

## Out of scope

- The manual site's own theme CSS. Its pages reuse the app's widgets, so they get the new scale
  through them.
- New colours or a redesign: colours are mapped to the existing palette.
- The visualizer and canvas drawing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `uikit`:
  - overflowing text on hover;
  - select highlight and keyboard;
  - one design scale for spacing, sizes, type and radii.

## Impact

- **Code:**
  - `src/assets/styles/tokens.css` and `global.css`;
  - a hover-scroll helper installed in `main.js` and in the manual's preview host;
  - a `uk-resize-handle` component, used by `app.activity.vue` and the group pool;
  - `uikit.input.select.vue`;
  - the `<style>` blocks of the 63 components under `src/views`.
- Showfile format: none.
- Unsaved marker: none.
- Live playback/timing: none.
- WSC output: none.
- Visualizer: none.
- Web vs Electron: same.

Manual:
- `getting-started/interface#widgets` (text scrolls on hover, select keys);
- `reference/shortcuts` (select keys);
- `npm run docs:manual:check`, since every preset uses uikit styles.
