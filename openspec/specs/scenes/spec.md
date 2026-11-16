# scenes Specification

## Purpose

Defines how operators set scene values for the fixtures of a group, per channel, per colour and
per Pan/Tilt, including fixtures made of several cells.

## Requirements

### Requirement: Scene cell selector
When the selected fixtures have cells, the scene view SHALL show the cell selector, with **All
cells** as the default and several cells selectable. For fixtures without cells the scene view
SHALL look and behave as before.

#### Scenario: Fixture without cells
- **GIVEN** a scene on a single-beam moving head
- **THEN** no cell selector shows, and the faders, colour picker and Pan/Tilt work as before

### Requirement: Scene controls write the selected cells
The scene's channel faders SHALL show each whole-fixture channel and, for the selected cells, one
fader per channel kind (for example one Dimmer and one Red). A fader, the colour picker and
Pan/Tilt SHALL write every matching channel of the selected cells in every selected fixture, and
the scene SHALL store each channel's value separately.

#### Scenario: Every cell reachable
- **GIVEN** a scene on a 12-cell bar
- **WHEN** the operator selects cell 7 and sets its dimmer to 200
- **THEN** the scene stores 200 for cell 7's dimmer only, and playing the scene outputs it

#### Scenario: All cells
- **WHEN** the operator selects **All cells** and sets the dimmer to 255
- **THEN** the scene stores 255 for all 12 cell dimmers

#### Scenario: Older show
- **GIVEN** a show saved before this change with a scene on a multi-cell fixture
- **WHEN** it is opened and the scene plays
- **THEN** every channel plays the value saved for it

### Requirement: The fade play dot follows the curve
The fade editor's play dot SHALL sit on the drawn curve, within 2 px, at the point the fade has
reached, while the scene fades in and after any edit of the curve. When the fade completes, the
dot SHALL stay at the curve's end.

#### Scenario: During a fade
- **GIVEN** a scene with a 4-bar EASE_IN fade in, started
- **WHEN** the operator watches the fade editor
- **THEN** the dot moves along the drawn curve from start to end

#### Scenario: After editing the curve
- **GIVEN** a fade stopped halfway
- **WHEN** the operator changes its type to EASE_OUT
- **THEN** the dot sits on the new curve, at the same progress

#### Scenario: At the end
- **GIVEN** the same fade, completed
- **WHEN** the operator looks at the fade editor
- **THEN** the dot is at the curve's end, not back at its start

### Requirement: Fades play as drawn
The system SHALL play a scene's fade by the curve drawn in its fade widget: at a fraction `x` of
the fade's duration, the fade's progress SHALL be the curve's value at time `x`, not at Bézier
parameter `x`. Linear fades are unchanged.

#### Scenario: Ease in at mid-fade
- **GIVEN** a scene fading in from 0 to 200 over 1 bar with the *Ease in* curve
  (control points 0.42, 0 and 1, 1)
- **WHEN** half a bar has passed
- **THEN** the channel reads about 63 (the curve's value at time 0.5 is about 0.315), within 2

#### Scenario: Linear is unchanged
- **GIVEN** the same scene with the *Linear* curve
- **WHEN** half a bar has passed
- **THEN** the channel reads 100

### Requirement: Fade presets
The system SHALL offer, as a fade's type, *Custom*, *Linear*, *Ease*, *Ease in*, *Ease out*,
*Ease in-out*, and *Sine*, *Quad*, *Cubic*, *Quart*, *Quint*, *Expo*, *Circ* and *Back* each *in*,
*out* and *in-out*, by these names, each with a picture of its curve. Picking one SHALL set the curve's control points; moving a
control point SHALL make the type *Custom*. A showfile SHALL keep the index of each existing type.

#### Scenario: Pick a preset
- **GIVEN** a selected scene with the *Linear* fade
- **WHEN** the operator opens the fade's type select, where each preset shows its curve, and picks
  *Expo out*
- **THEN** the type reads *Expo out* with its curve, the control points read 0.16, 1 and 0.3, 1, the curve is
  redrawn, and the unsaved marker appears

#### Scenario: Older showfile
- **GIVEN** a showfile saved with a scene fading *Ease in-out* (type 5)
- **WHEN** it is loaded
- **THEN** the scene's fade type reads *Ease in-out*

### Requirement: Fade curves can overshoot
The system SHALL accept control point Y values from −1 to 2 (X from 0 to 1), by typing or
dragging, and SHALL draw the curve with room above 1 and below 0. Channel output SHALL stay within
DMX 0–255.

#### Scenario: Back out
- **GIVEN** a scene fading in to 255 with *Back out*
- **WHEN** it plays
- **THEN** the drawn curve rises above the top line before settling, and the channel never
  exceeds 255
