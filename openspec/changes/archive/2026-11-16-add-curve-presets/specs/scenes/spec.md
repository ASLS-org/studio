## ADDED Requirements

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
