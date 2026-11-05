## MODIFIED Requirements

### Requirement: Quality setting is per device
The system SHALL provide a Quality setting (Auto, Guides, Low, Medium, High), a lighting resolution
scale and a render resolution (50%, 80%, 100%, default 80%) in the visualizer settings, SHALL keep
them on the device across reloads, and SHALL NOT store them in the showfile or mark the show unsaved
when they change. When the device cannot store them, the settings SHALL fall back to their defaults.

#### Scenario: Setting survives reload
- **WHEN** the operator sets quality to Low and reloads the app
- **THEN** quality is still Low

#### Scenario: Not part of the show
- **GIVEN** a saved show with no unsaved changes
- **WHEN** the operator changes the quality or the render resolution
- **THEN** the toolbar shows no unsaved marker, and opening the same showfile on another machine
  uses that machine's own settings

#### Scenario: Storage blocked
- **GIVEN** a browser that blocks site storage
- **WHEN** the visualizer starts
- **THEN** quality is Auto, the render resolution is 80%, and the visualizer works normally

#### Scenario: Render resolution
- **WHEN** the operator sets the render resolution to 100%
- **THEN** the view redraws sharper at once, without reloading the show

### Requirement: Bloom and lens glow
The system SHALL draw a glow on the lens of each lit fixture at the Low, Medium and High levels,
sized from the lens and scaled by the beam's intensity and light output, and SHALL add a soft bloom
around bright beams and lenses at Medium and High. Cells that only glow SHALL get a smaller glow.

#### Scenario: Lens glow
- **WHEN** a fixture's dimmer goes from 0 to 255
- **THEN** its lens glows brighter, in the beam's colour

#### Scenario: No bloom at Low
- **WHEN** the quality is Low
- **THEN** lenses glow without bloom spreading around them

#### Scenario: Pixel bar beside a moving head
- **GIVEN** a 12-cell pixel bar and a moving head, both at full white
- **THEN** each pixel's glow is small, and the bar does not glow brighter than the moving head

## ADDED Requirements

### Requirement: Beams in the haze fade from the lens
The system SHALL draw a beam in the haze brightest near its lens and fading along the shaft, as
light falls off with distance from its source. A beam bright enough to saturate SHALL roll off
toward white where it is brightest, instead of clipping in its colour.

#### Scenario: Shaft seen from the side
- **GIVEN** a moving head at full intensity in haze, seen from the side
- **THEN** its shaft is brightest near the lens and fades toward the floor

#### Scenario: Saturated neck
- **GIVEN** a strong blue beam seen from the side
- **THEN** its neck is pale and bright, and the shaft is deep blue further out

### Requirement: Brightness follows the fixture's light output
The system SHALL scale each beam's light on surfaces and in the haze by its fixture's light output
(GDTF luminous flux, OFL bulb lumens, 10,000 lm when unknown), on a compressed scale (square root,
relative to 5,000 lm) and within limits, so fixtures keep their order and faint ones stay visible. The cells of a multi-cell fixture SHALL share
its light: a cell carries its own luminous flux (GDTF) or the fixture's lumens divided by its cells
(OFL).

#### Scenario: Small PAR beside a large spot
- **GIVEN** a 2,000 lm PAR and a 20,000 lm spot at the same dimmer and zoom
- **THEN** the spot's footprint and shaft are brighter than the PAR's

#### Scenario: Pixel bar
- **GIVEN** an OFL pixel bar of 12 pixels and 3,000 lm
- **THEN** each pixel lights as a 250 lm source
