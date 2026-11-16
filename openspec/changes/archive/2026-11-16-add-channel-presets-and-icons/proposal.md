# Proposal

## Why

Most fixture channels are split into
ranges (*Closed*, *Strobe slow → fast*, *Gobo 3*, *Sound active*), and finding one means dragging
the fader while watching the rig. The icon above each fader should help, but it is found by the
channel's type name: 70% of channels in the bundled OFL library (24,869 of 35,503) show an "x",
amber, UV and pixel colours among them. Imported GDTF files name functions with about 250
standard attributes (`Gobo2PosRotate`, `ColorAdd_RY`, `Blade3A`), most of which miss too.

## What Changes

- **Channel box and ranges:** under each value, a box shows the channel's icon and its current
  range (or name). Clicking it lists the ranges under the channel's full name, each with its DMX
  span (`20–24 Open`), searchable when long; picking one sets the channel to that range's start.
  Every channel has one; scene rows list ranges only when the selected fixtures share them.
- **Range labels:** every capability gets a short `label`. It comes from the fixture's comment
  (OFL) or channel set name (GDTF), or is built from its type and data (effect name, wheel slot
  name, colour, shutter effect, speed). Never saved.
- **Icons:** each channel's icon is chosen from its standard (GDTF) attribute, matched by family
  for OFL and GDTF alike (`ColorAdd_*`, `Gobo<n>Pos*`, `Shutter<n>Strobe*`…), then from words in
  its name, then a generic channel icon. Never the "x". New icons cover the missing functions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `fixtures`: OFL and GDTF ranges have labels; channel faders show an icon for their function
  and a preset menu of their ranges.

## Impact

- Showfile format: none (labels and icons are derived, never saved). Older files load unchanged.
- Unsaved marker: picking a preset changes a scene's value like the fader does.
- Live playback/timing, WSC output, visualizer: none beyond the channel value set.
- Web vs Electron: same.
- Code: `models/fixtures` (labels in the OFL and GDTF adapters, `Capability.label`), the channels
  widget, `uk-select` (an icon trigger), new SVGs in `uikit/icons/images`, a channel icon helper.

**Out of scope:** presets for colour wheels shown as colour swatches (the colour picker covers
colour); saving user presets; a preset menu on the effect tool's channels; changing type keys.

**Manual:** `programming/patching` and `programming/scenes` (channels widget), preview
`fixture-channels`.
