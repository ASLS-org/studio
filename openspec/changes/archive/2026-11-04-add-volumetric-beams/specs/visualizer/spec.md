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
The system SHALL replace the Fogging settings with a Haze Density setting (0-100), saved in the
showfile: one uniform haze, without shape or motion. Density 0 SHALL hide every air beam; higher
density makes beams brighter in the air.

#### Scenario: No haze
- **WHEN** the operator sets haze Density to 0
- **THEN** no beam shows in the air, and light on the floor is unchanged

#### Scenario: Still haze
- **GIVEN** the show stopped and the camera still
- **WHEN** a few seconds pass at any quality level
- **THEN** the visualizer draws no new frames, whatever the haze density

#### Scenario: Haze saved with the show
- **WHEN** the operator sets Density to 40, saves and reloads the show
- **THEN** Density is 40

### Requirement: Older showfiles keep their fog look
The system SHALL open showfiles saved before Haze existed with haze Density 50, since their beams
always showed in the air; their fog settings are ignored.

#### Scenario: Fog disabled in an old showfile
- **GIVEN** a showfile saved with fogging disabled
- **WHEN** it is opened
- **THEN** beams show in the air with haze Density 50

#### Scenario: Demo show
- **GIVEN** the demo showfile (fog settings only)
- **WHEN** it is opened
- **THEN** haze Density is 50, and saving it writes the haze setting

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

### Requirement: Wider beams spread the same light
The system SHALL keep a beam's total light constant across its field angle: zooming a fixture wider
SHALL make its footprint and its beam in the air dimmer per area, and zooming narrower SHALL make
them brighter, within limits so very narrow or very wide beams stay visible.

#### Scenario: Zoom out
- **GIVEN** a fixture lighting the floor with its dimmer at 255
- **WHEN** its zoom goes from its narrowest to its widest field angle
- **THEN** its footprint grows and gets dimmer, and its beam in the air gets fainter

### Requirement: Beams look smooth and directional
The system SHALL draw beams in the air with soft edges and without visible grain or blocky steps at
every level, brighter when looked at from in front of the fixture than from the side, and SHALL
keep overlapping beams from washing the view out.

#### Scenario: Looking into a beam
- **GIVEN** a beam in haze
- **WHEN** the camera moves from the side of the beam to in front of the fixture
- **THEN** the beam and its lens glow get brighter

#### Scenario: Low level edges
- **WHEN** the quality is Low
- **THEN** beam edges in the air are soft, without visible steps

### Requirement: Light from several beams mixes like real light
The system SHALL add the light of overlapping beams on a surface before applying the scene's tone
curve, so overlapping red, green and blue beams make white, red and green make yellow, and no
footprint shows a visible step where it overlaps another, at every level that lights surfaces.

#### Scenario: RGB overlap
- **GIVEN** three fixtures in red, green and blue whose footprints overlap on the floor
- **WHEN** the quality is Low, Medium or High
- **THEN** the overlap is white, pairs show yellow, cyan and magenta, and no layered edges show

#### Scenario: Grazing beam
- **WHEN** a fixture lights the floor at a grazing angle
- **THEN** its footprint shows in full, up to the end of the beam, without being cut

### Requirement: Exposure setting
The system SHALL provide an Exposure setting (25-400 %, default 100, saved in the showfile) that
scales the brightness of the beams in the air, their lens glow and bloom, and the light they cast
on surfaces through the scene's tone curve. 100 SHALL give the physically scaled result.

#### Scenario: Brighter view
- **WHEN** the operator raises Exposure from 100 to 200
- **THEN** beams and their footprints get brighter and still roll off smoothly instead of clipping

#### Scenario: Showfile without Exposure
- **WHEN** a showfile saved before Exposure existed is opened
- **THEN** Exposure is 100

### Requirement: Zoom follows the fixture's lens
The system SHALL turn a fixture's Zoom channel into its field angle within the fixture's lens
range: zoom values given as "narrow" / "wide" presets or percentages SHALL span the lens's
minimum to maximum angle, and zoom values given in degrees SHALL be used as the field angle.

#### Scenario: Preset zoom
- **GIVEN** a MAC Aura (lens 11-58 degrees, Zoom "wide" to "narrow")
- **WHEN** its Zoom channel goes from 0 to 255
- **THEN** its beam narrows from about 58 to about 11 degrees, never to a pinpoint

