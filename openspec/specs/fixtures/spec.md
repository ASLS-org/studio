# fixtures Specification

## Purpose

Defines how patched fixtures expose their modes and channels to the operator and the show, so a
fixture always outputs the channel layout of the mode it was patched in, before and after the show
is saved and reopened.

## Requirements

### Requirement: Fixture uses the mode chosen when patching
The system SHALL build each patched fixture with the channels of the mode selected in the patch
popup, in that mode's order, and occupy exactly that many DMX addresses per fixture.

#### Scenario: Patch a fixture in a non-default mode
- **GIVEN** a library fixture whose first mode has 14 channels and whose second mode has 20
- **WHEN** the operator patches 2 of them in the second mode from address 1
- **THEN** the first fixture occupies addresses 1-20 and the second 21-40
- **AND** each fixture's channel faders list the second mode's 20 channels in its order

### Requirement: Fixture mode is saved with the show
The system SHALL save each fixture's mode in the showfile and restore it when the show is reloaded
or loaded from a file. A fixture without a saved mode, or with a mode the fixture definition no
longer has, SHALL load in its first mode.

#### Scenario: Reload keeps the mode
- **GIVEN** a fixture patched in its second mode
- **WHEN** the operator saves the show and reloads the page
- **THEN** the fixture settings widget shows the second mode and the fixture outputs that mode's
  channel layout

#### Scenario: Older showfile without modes
- **GIVEN** a showfile saved before modes were stored, such as the demo show
- **WHEN** it is loaded
- **THEN** every fixture loads in its first mode, as before

### Requirement: Changing mode keeps shared channel values
The system SHALL keep the value of every channel that exists in both the old and the new mode
(same channel type and index within that type) when the operator changes a patched fixture's
mode, set channels that only exist in the new mode to 0, and update the visualizer accordingly.

#### Scenario: Switch to a mode with the same core channels
- **GIVEN** a patched fixture with Dimmer at 200 and Pan at 100 in its first mode
- **WHEN** the operator selects another mode that also has Dimmer and Pan
- **THEN** Dimmer stays at 200 and Pan at 100, and channels new to that mode are at 0

### Requirement: Changing mode keeps the universe patch consistent
The system SHALL move a fixture's occupied address range to the new mode's channel count when its
mode changes, and SHALL refuse the change, with an error message and the fixture left in its
current mode, if the new range would overlap another fixture or pass address 512.

#### Scenario: Larger mode fits
- **GIVEN** a fixture on addresses 1-14 and nothing patched from address 15 to 40
- **WHEN** the operator switches it to a 20-channel mode
- **THEN** the fixture occupies addresses 1-20

#### Scenario: Larger mode would overlap
- **GIVEN** a fixture on addresses 1-14 and another fixture starting at address 15
- **WHEN** the operator switches the first fixture to a 20-channel mode
- **THEN** an error explains the mode would overlap another fixture
- **AND** the first fixture stays in its previous mode on addresses 1-14

### Requirement: Fine channels follow their coarse channel
The system SHALL drive a channel's fine (16-bit) companion from the same value: the coarse channel
receives the integer part (DMX 0-255) and the fine channel the fractional part scaled to 0-255 and
rounded to the nearest step. Channels without a fine companion receive the value rounded to the
nearest step.

#### Scenario: Fractional pan value
- **GIVEN** a fixture with Pan and Pan fine channels
- **WHEN** an effect sets Pan to 127.5
- **THEN** the Pan channel outputs 127 and the Pan fine channel outputs 128 (0.5 x 255 = 127.5)

#### Scenario: Whole value
- **GIVEN** the same fixture
- **WHEN** a scene sets Pan to 200
- **THEN** the Pan channel outputs 200 and the Pan fine channel outputs 0

### Requirement: Saved scenes keep driving the same channels
The system SHALL keep the channel identifiers that scenes store in showfiles (channel type and
index within that type) stable, so scenes saved before this change control the same channels with
the same values.

#### Scenario: Demo show scenes
- **GIVEN** the demo show, whose scenes were saved before this change
- **WHEN** a scene with Dimmer, Zoom and colour values is started
- **THEN** the same fixtures' Dimmer, Zoom and colour channels reach the saved DMX values (0-255)

### Requirement: GDTF fixtures play like OFL fixtures
The system SHALL drive a GDTF fixture's channels exactly as an OFL fixture's: every DMX channel
of the chosen mode at its address, 16-bit channels as a coarse and a fine byte, and channel values
set by scenes, effects and faders. Channels SHALL carry the same channel names used for OFL
fixtures (Dimmer, Pan, Tilt, Red, Color Wheel...), so effects and quick accessors apply to them.

#### Scenario: Dimmer and position
- **GIVEN** a patched GDTF moving head
- **WHEN** a scene sets its Dimmer to 255 and its Pan to 128
- **THEN** the output universe carries 255 on its Dimmer address and 128 on its Pan coarse address

#### Scenario: Fine channel
- **WHEN** a fader sets a GDTF fixture's 16-bit Tilt to half
- **THEN** its coarse and fine Tilt addresses carry the matching two bytes

### Requirement: Multi-cell fixtures have one set of channels per cell
For a GDTF fixture made of repeated cells (bars, pixel fixtures, multi-beam heads), the system
SHALL expose each cell's channels separately, in DMX order, and SHALL apply a channel shared by
the whole fixture (for example a master Dimmer) to every cell.

#### Scenario: Pixel bar cells
- **GIVEN** a patched 12-cell RGB bar from GDTF
- **WHEN** a scene sets cell 3's Red to 255 and the others to 0
- **THEN** only the third cell's Red address carries 255

### Requirement: OFL pixel fixtures have their full channel list
For OFL fixtures with pixel (matrix) channels, the system SHALL patch every pixel channel of the
chosen mode, in the order the fixture defines, named after its pixel (for example `Red 3`), so the
fixture occupies its real number of DMX channels.

#### Scenario: OFL pixel bar footprint
- **GIVEN** an OFL pixel bar whose mode has 3 channels for each of 8 pixels
- **WHEN** the operator patches it at address 1
- **THEN** it occupies addresses 1-24, and Red 3 sits at address 7

#### Scenario: Footprint grew in an older show
- **GIVEN** a show saved with an OFL moving head whose pixel channels used to be dropped
- **WHEN** the show is opened
- **THEN** the fixture opens with its full channel list, and a message names it so the operator
  can check its address

### Requirement: A fixture's cells
The system SHALL treat as a fixture's cells the parts that repeat a set of channels: GDTF
geometries such as heads, pixels or arrays, and OFL pixels. A part inside a cell belongs to that
cell (a head's tilt belongs with its yoke's pan). Channels outside every cell, such as a master
dimmer, a strobe, pan on the base or an OFL pixel group, SHALL belong to the whole fixture. A
fixture whose parts don't repeat channels SHALL have no cells.

#### Scenario: Pixel bar
- **GIVEN** a patched GDTF bar with 8 pixels of R, G, B and a master dimmer
- **THEN** it has 8 cells of 3 channels each, and the master dimmer belongs to the whole fixture

#### Scenario: Single-beam moving head
- **GIVEN** a patched moving head with pan on its yoke and tilt, dimmer and colour on its head
- **THEN** it has no cells

### Requirement: Universe view controls per cell
When the selected fixture has cells, the universe view SHALL show a cell selector with **All
cells** (the default) and each cell by name, allowing several cells to be selected. The channel
faders SHALL list the whole-fixture channels and the channels of the selected cells, and the
colour picker and Pan/Tilt SHALL read and write the selected cells only (all of them under **All
cells**). For a fixture without cells the view SHALL look and behave as before.

#### Scenario: One cell's colour
- **GIVEN** a patched 8-pixel bar selected in the universe view
- **WHEN** the operator selects cell 3 and picks blue
- **THEN** cell 3 outputs blue and the other cells keep their values

#### Scenario: All cells
- **WHEN** the operator selects **All cells** and picks red
- **THEN** every cell outputs red

#### Scenario: Second head
- **GIVEN** a patched fixture with two heads, each with its own Pan and Tilt
- **WHEN** the operator selects the second head and moves Pan/Tilt
- **THEN** only the second head's Pan and Tilt channels change

### Requirement: The colour picker drives white
On a cell or fixture with a white channel, the colour picker SHALL write white as the smallest of
red, green and blue (DMX 0-255), and red, green and blue less that white. Reading the colour back
SHALL add white to each of red, green and blue (at most 255). Amber, UV and lime channels SHALL
stay as they are.

#### Scenario: RGBW pick
- **GIVEN** an RGBW fixture
- **WHEN** the operator picks red 255, green 128, blue 128
- **THEN** the fixture outputs white 128, red 127, green 0, blue 0, and the picker shows
  255, 128, 128

### Requirement: Channel ranges have labels
The system SHALL give every DMX range of a fixture channel a short label: the fixture's own text
for that range when it has one (OFL comment, GDTF channel set name), otherwise a label built from
the range's function and data (effect name, wheel slot name, colour, shutter effect, speed span).
Labels SHALL NOT be saved in the showfile.

#### Scenario: A strobe range without a comment
- **GIVEN** an OFL channel range of type ShutterStrobe with shutter effect *Strobe*, a slow start
  speed, a fast end speed and no comment
- **WHEN** the fixture is patched
- **THEN** the range's label reads *Strobe slow → fast*

#### Scenario: A GDTF channel set
- **GIVEN** an imported GDTF fixture whose shutter channel function has channel sets *Closed*,
  *Open* and *Strobe*
- **WHEN** the fixture is patched
- **THEN** its shutter ranges are labelled *Closed*, *Open* and *Strobe*, and a channel set with no
  name gets a label built from its function

#### Scenario: A gobo wheel slot
- **GIVEN** an OFL WheelSlot range pointing at slot 3 of a gobo wheel whose slot 3 is named *Dots*
- **WHEN** the fixture is patched
- **THEN** the range's label reads *Dots*

### Requirement: Channel faders show an icon for their function
The system SHALL show above each channel fader an icon for the channel's function, chosen from its
standard (GDTF) attribute matched by family, so numbered GDTF attributes (`Gobo2PosRotate`,
`Shutter1StrobeRandom`) find the icon of their family, then from words in its name, then a generic
channel icon. No channel of an OFL or GDTF fixture SHALL show the missing-icon "x".

#### Scenario: Amber and pixel colours
- **GIVEN** a fixture with an *Amber* channel and pixel channels *Red 3*, *Green 3*, *Blue 3*
- **WHEN** the operator selects it in a universe
- **THEN** the Amber fader shows the amber icon and the pixel faders show the red, green and blue
  icons

#### Scenario: Every library channel has an icon
- **GIVEN** every mode of every bundled OFL fixture and every bundled GDTF fixture
- **WHEN** the icon of each of its channels is looked up
- **THEN** each one names an icon that exists, and none is the "x"

#### Scenario: Numbered GDTF attributes
- **GIVEN** an imported GDTF fixture with channels `Gobo2PosRotate`, `Color2`,
  `Shutter1StrobeRandom` and `ColorAdd_RY`
- **WHEN** the operator selects it in a universe
- **THEN** they show the gobo rotation, colour wheel, strobe and amber icons

### Requirement: Each channel has a box showing its function and range
The system SHALL show under each channel's value a box with the channel's icon and, for a channel
with more than one DMX range, the label of the range holding its value, else the channel's name,
cut with an ellipsis when too long. Its tooltip SHALL give the channel's full name and that range.
Channel columns SHALL be at most 64 px wide.

#### Scenario: Box follows the value
- **GIVEN** a *Shutter* channel with ranges *0–19 Closed* and *20–24 Open*, at value 22
- **WHEN** the operator looks at its box and hovers it
- **THEN** the box shows the shutter icon and *Open*, and the tooltip reads *Shutter: Open*

### Requirement: Every channel's box opens its ranges
The system SHALL open, when the operator clicks any channel's box (fine and single-range channels
included), a list headed by the channel's icon and full name, with one row per range (label, then DMX
span) in DMX order, with the range holding the current value marked. Picking a range SHALL set the
channel to that range's first DMX value, as the fader would.

#### Scenario: Pick a strobe preset in a universe
- **GIVEN** a fixture whose shutter channel has ranges *0–19 Closed*, *20–24 Open* and *25–64
  Strobe fast → slow*, at value 0
- **WHEN** the operator clicks the shutter box and picks *Open*
- **THEN** the shutter fader reads 20, the fixture outputs 20 on that channel, and reopening the
  list marks *Open*

#### Scenario: A dimmer's list
- **GIVEN** a channel *Beam dimmer* with one range spanning 0–255
- **WHEN** the operator clicks its box
- **THEN** a list headed *Beam dimmer* shows its one range

#### Scenario: Search
- **GIVEN** the MAC Aura's shutter list is open
- **WHEN** the operator types *strobe*
- **THEN** only the ranges whose label contains *strobe* remain

#### Scenario: Keyboard
- **GIVEN** a channel's list is open
- **WHEN** the operator presses Down then Enter
- **THEN** the next range is picked, and Escape closes the list without changing the value

#### Scenario: Pick a preset in a scene
- **GIVEN** a scene with two fixtures of the same type selected and their shutter channel inactive
- **WHEN** the operator picks *Open* from the shutter's list
- **THEN** both fixtures' shutter channels are set to 20 in the scene, become active, and the
  unsaved marker appears

### Requirement: Range lists are searchable and keep one size
The system SHALL give every channel's range list a search field that keeps the ranges whose text
contains what is typed, and SHALL keep the list one size whatever its length, the space its ranges
don't fill shown idle.

#### Scenario: A one-range list
- **GIVEN** the *Beam dimmer* list is open (one range)
- **WHEN** the operator types *zzz* in its search field
- **THEN** the list keeps its size and shows *Nothing to display* on the idle background

### Requirement: Scene presets need shared ranges
The system SHALL list a fader's ranges in a scene only when every selected fixture's channel
behind that fader has the same ranges and labels; otherwise its list says *Ranges differ between
fixtures*.

#### Scenario: Two fixture types
- **GIVEN** a scene with fixtures of two types selected whose shutter channels have different
  ranges
- **WHEN** the operator clicks the shutter box
- **THEN** the list shows the channel's name and *Ranges differ between fixtures*
