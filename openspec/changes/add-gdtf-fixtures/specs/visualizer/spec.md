## ADDED Requirements

### Requirement: Every patched fixture shows in the view
The system SHALL draw every patched fixture in the 3D view, whatever its category, with a body
generated from the fixture's description: its category (moving head, can, bar, panel), its
dimensions, its pan/tilt axes and its beams or cells placed as described. OFL moving heads without
pixel channels SHALL look as before.

#### Scenario: OFL PAR
- **GIVEN** a patched OFL `Color Changer` with its dimmer at 255 and red at 255
- **THEN** the view shows a can sized from the fixture's dimensions, with a red beam lighting the
  floor

#### Scenario: OFL pixel bar
- **GIVEN** a patched OFL pixel bar
- **WHEN** a scene lights pixel 3 in blue and the others off
- **THEN** the bar shows its cells in a row, and only the third is blue

#### Scenario: GDTF moving head
- **WHEN** a GDTF moving head's Pan goes from 0 to 255
- **THEN** its yoke and head turn through the fixture's pan range, and the beam follows

### Requirement: Each beam of a multi-beam fixture follows its own channels
The system SHALL drive each beam or cell of a GDTF or OFL pixel fixture from its own channels
(dimmer, colour, gobo, zoom), with fixture-wide channels applying to all of them, and SHALL show
every cell lit in its own colour on the fixture. The light a fixture casts on surfaces and in the
haze SHALL combine neighbouring cells that point the same way into a few beams, with their summed
intensity and mixed colour. Cells the fixture describes as not projecting SHALL cast no light.

#### Scenario: Beam colours
- **GIVEN** a patched multi-beam GDTF fixture
- **WHEN** a scene sets beam 1 to red and beam 2 to blue
- **THEN** the view shows a red and a blue beam from the same fixture

#### Scenario: LED wash
- **GIVEN** a GDTF LED wash with 37 cells, all at full white
- **THEN** its lens shows 37 lit cells, and it casts one beam

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
