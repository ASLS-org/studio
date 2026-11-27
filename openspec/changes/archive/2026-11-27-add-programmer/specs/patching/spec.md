## ADDED Requirements

### Requirement: Universe-view edits reach every selected fixture

A value set in the universe view (a channel fader or value, a channel preset, the colour picker,
pan/tilt) SHALL apply to every selected fixture of that universe, and the faders SHALL show the
first selected fixture. A channel value SHALL go to the channels of the same function on each
fixture (the same cells where they exist); fixtures without that channel SHALL be left alone.

#### Scenario: Two fixtures of different types

- **GIVEN** a MAC Aura and a generic PAR selected, the Aura first
- **WHEN** the operator sets the Dimmer fader to 200
- **THEN** both fixtures' Dimmer channels carry 200

#### Scenario: A channel one fixture lacks

- **GIVEN** a moving head and a PAR without pan selected
- **WHEN** the operator moves pan
- **THEN** the moving head pans and the PAR is unchanged

### Requirement: Colour and aim across fixture types

The colour picker SHALL mix the colour on each selected fixture's own colour channels. Pan/tilt
SHALL set the same angle on each selected fixture whose pan and tilt ranges are known, and the same
DMX values otherwise.

#### Scenario: Same colour

- **GIVEN** an RGBW fixture and an RGB fixture selected
- **WHEN** the operator picks orange in the colour picker
- **THEN** both show orange, each from its own colour channels

#### Scenario: Same angle

- **GIVEN** two moving heads with different pan ranges (540° and 360°) selected
- **WHEN** the operator sets pan to 90° from the first
- **THEN** both point 90° from their pan centre

### Requirement: Park and Clear are in the channel's menu

A channel's range menu (its box under the value) SHALL start with **Park at <value>**, which parks
that channel at that value (the first selected fixture's) on every selected fixture, or **Unpark** when the channel is
parked, which frees it on every selected fixture. While the channel is in the programmer,
**Clear** SHALL follow it. The ranges come after them.

#### Scenario: Parking a hazer

- **GIVEN** a hazer fixture selected, its output channel at 76
- **WHEN** the operator opens the channel's menu and picks **Park at 76**
- **THEN** the channel is parked at 76 and the menu now starts with **Unpark**

#### Scenario: Clear in the menu

- **GIVEN** a selected fixture's Dimmer in the programmer
- **WHEN** the operator opens the Dimmer's menu
- **THEN** it reads **Park at <value>**, then **Clear**, then the Dimmer's ranges
