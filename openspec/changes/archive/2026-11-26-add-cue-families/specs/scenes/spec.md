## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Scenes end once faded in

**Reason**: Scenes now stay on while they hold a family, so the row shows what is on stage.
**Migration**: Click a playing scene to turn it off; see "Scenes stay on while they hold a family".
