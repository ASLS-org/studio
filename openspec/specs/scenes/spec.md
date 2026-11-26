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

### Requirement: Scene fade times

A scene SHALL have a Fade In and a Fade Out, each with its own time in bars (0 to 64), set in its
fade widgets. A time of 0 SHALL apply the change at once. Cue Settings SHALL NOT show a Duration
or a Loop Style for a scene. A scene from a showfile without fade times SHALL take its saved
Duration as its Fade In time and 0 as its Fade Out time.

#### Scenario: Scene settings

- **WHEN** a scene is selected
- **THEN** Cue Settings shows no Duration and no Loop Style, and the Fade In and Fade Out widgets
  each have a Bars field

#### Scenario: Older scene

- **WHEN** a showfile saved before this change, with a scene of Duration 4, is loaded
- **THEN** that scene's Fade In time is 4 bars and its Fade Out time is 0

### Requirement: Scenes stay on while they hold a family

A started scene SHALL fade in over its Fade In time from what the fixtures show, then SHALL stay
on, its row showing it playing, while it holds a family (see playback). Stopping it SHALL show it stopped at
once and hand its families back over its Fade Out time. Starting it again during its fade-out
SHALL fade in from where the fade-out got to.

#### Scenario: Stays on

- **WHEN** a scene with a 2-bar Fade In is started and 4 bars pass
- **THEN** its channels hold the scene's values and its row still shows it playing

#### Scenario: Turned off alone

- **WHEN** the only cue on a fixture, a scene with a 1-bar Fade Out setting Dimmer at 255, is
  turned off
- **THEN** its row shows it stopped at once, and after 1 bar its Dimmer is 0

#### Scenario: Turned off over another scene

- **WHEN** a Layer scene started over another scene, with a 1-bar Fade Out, is turned off
- **THEN** after 1 bar its channels are back at the other scene's values

### Requirement: The scene editor follows the family

A scene SHALL show in its channels widget only the channels of its family and those of no family.
The colour picker SHALL show for Colour scenes only, and the pan/tilt picker for Position scenes
only.

#### Scenario: Colour scene

- **WHEN** a Colour scene of moving heads is selected
- **THEN** the channels widget lists only colour channels, the colour picker shows, and the
  pan/tilt picker doesn't
