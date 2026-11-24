## ADDED Requirements

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
