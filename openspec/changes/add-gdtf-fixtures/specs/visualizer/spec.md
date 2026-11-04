## ADDED Requirements

### Requirement: Every patched fixture shows in the view
The system SHALL draw every patched fixture in the 3D view, whatever its category: GDTF fixtures
with their bodies, pan/tilt axes and beams placed as the fixture describes, and other OFL fixtures
as a simple body with one beam. Moving heads from the OFL library SHALL look as before.

#### Scenario: OFL PAR
- **GIVEN** a patched OFL `Color Changer` with its dimmer at 255 and red at 255
- **THEN** the view shows a body with a red beam lighting the floor

#### Scenario: GDTF moving head
- **WHEN** a GDTF moving head's Pan goes from 0 to 255
- **THEN** its yoke and head turn through the fixture's pan range, and the beam follows

### Requirement: Each beam of a multi-beam fixture follows its own channels
The system SHALL drive each beam or cell of a GDTF fixture from its own channels (dimmer, colour,
gobo, zoom), with fixture-wide channels applying to all of them. LED cells and pixels that the
fixture describes as glowing rather than projecting SHALL light up in their colour without
casting beams.

#### Scenario: Beam colours
- **GIVEN** a patched multi-beam GDTF fixture
- **WHEN** a scene sets beam 1 to red and beam 2 to blue
- **THEN** the view shows a red and a blue beam from the same fixture

#### Scenario: Pixel cells
- **GIVEN** a GDTF pixel bar whose cells glow
- **WHEN** a chase lights its cells one after another
- **THEN** the cells light in sequence in the view, and they cast no beams

### Requirement: GDTF gobos show their real image
The system SHALL show a GDTF fixture's gobo wheel images on lit surfaces and, at High quality, in
the haze, in place of the built-in patterns, with rotation, focus and frost applied as for
built-in gobos.

#### Scenario: Real gobo
- **GIVEN** a GDTF fixture whose gobo wheel has images
- **WHEN** its gobo channel selects a gobo slot
- **THEN** the footprint on the floor shows that slot's image
