## ADDED Requirements

### Requirement: In-air beams follow the quality level
The system SHALL draw each lit beam in the air, in its colour and intensity and with its field
angle, at the Low, Medium and High quality levels, and SHALL draw no air beam at the Guides level.
Beams SHALL end where they meet the floor. At Medium and High a beam SHALL be hidden where a
fixture body stands in front of it.

#### Scenario: Low level
- **GIVEN** a moving head with its dimmer at 255 and haze density above 0
- **WHEN** the quality is Low
- **THEN** its beam shows in the air as an even haze cone from the lens to the floor

#### Scenario: Guides level
- **WHEN** the quality is Guides
- **THEN** no beam shows in the air, and the beam guides show as before

#### Scenario: Dimmer closed
- **WHEN** a fixture's dimmer is at 0
- **THEN** its beam does not show in the air at any level

### Requirement: Gobos show in the haze at High quality
At the High quality level, the system SHALL show each beam's gobo pattern in the haze as shafts
of light that match the pattern projected on the floor, turning with gobo rotation and blurring
with focus or frost. At Medium the gobo SHALL only soften the beam.

#### Scenario: Gobo shafts
- **GIVEN** quality High, haze density above 0 and a fixture showing a dotted gobo
- **WHEN** the camera looks along the beam
- **THEN** the beam shows separate shafts in the haze that line up with the dots on the floor

#### Scenario: Rotating gobo in the haze
- **WHEN** that fixture's gobo rotates
- **THEN** the shafts in the haze turn with the pattern on the floor

### Requirement: Haze settings
The system SHALL replace the Fogging settings with Haze settings, Density and Movement (each
0-100), saved in the showfile. Density 0 SHALL hide every air beam; higher density makes beams
brighter in the air. Movement above 0 SHALL make the haze drift over time.

#### Scenario: No haze
- **WHEN** the operator sets haze Density to 0
- **THEN** no beam shows in the air, and light on the floor is unchanged

#### Scenario: Drifting haze
- **GIVEN** quality High and haze Movement above 0
- **WHEN** the show is stopped and the camera still
- **THEN** the haze in the beams keeps drifting

#### Scenario: Haze saved with the show
- **WHEN** the operator sets Density to 40, saves and reloads the show
- **THEN** Density is 40

### Requirement: Older showfiles keep their fog look
The system SHALL read the fog settings of showfiles saved before Haze existed and map them to Haze:
fog disabled gives Density 0, fog density gives Density and fog turbulence gives Movement.

#### Scenario: Fog disabled in an old showfile
- **GIVEN** a showfile saved with fogging disabled
- **WHEN** it is opened
- **THEN** haze Density is 0 and no beam shows in the air

#### Scenario: Demo show
- **GIVEN** the demo showfile (fog density 80, turbulence 50)
- **WHEN** it is opened
- **THEN** haze Density is 80, Movement is 50, and saving it writes the haze settings

### Requirement: Bloom and lens glow
The system SHALL draw a glow on the lens of each lit fixture, scaled by its intensity, at the Low,
Medium and High levels, and SHALL add a soft bloom around bright beams and lenses at Medium and
High.

#### Scenario: Lens glow
- **WHEN** a fixture's dimmer goes from 0 to 255
- **THEN** its lens glows brighter, in the beam's colour

#### Scenario: No bloom at Low
- **WHEN** the quality is Low
- **THEN** lenses glow without bloom spreading around them

### Requirement: Air beam detail adapts first
With the quality setting on Auto at the High level, the system SHALL lower the detail of the air
beams before lowering the lighting resolution or the level.

#### Scenario: Slow frames at High
- **GIVEN** quality on Auto at High with full resolution
- **WHEN** frames stay slow for several seconds
- **THEN** the air beams lose detail first, and the resolution drops only if frames are still slow
