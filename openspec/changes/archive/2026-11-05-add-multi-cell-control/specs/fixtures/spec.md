## ADDED Requirements

### Requirement: A fixture's cells
The system SHALL treat as a fixture's cells the parts that repeat a set of channels: GDTF
geometries such as heads, pixels or arrays, and OFL pixels. A part inside a cell belongs to that
cell (a head's tilt belongs with its yoke's pan). Channels outside every cell, such as a master
dimmer, a strobe, pan on the base or an OFL pixel group, SHALL belong to the whole fixture. A
fixture whose parts don't repeat channels SHALL have no cells.

#### Scenario: Pixel bar
- **GIVEN** a patched GDTF bar with 8 pixels of R, G, B and a master dimmer
- **THEN** it has 8 cells of 3 channels each, and the master dimmer belongs to the whole fixture

#### Scenario: Single-beam moving head
- **GIVEN** a patched moving head with pan on its yoke and tilt, dimmer and colour on its head
- **THEN** it has no cells

### Requirement: Universe view controls per cell
When the selected fixture has cells, the universe view SHALL show a cell selector with **All
cells** (the default) and each cell by name, allowing several cells to be selected. The channel
faders SHALL list the whole-fixture channels and the channels of the selected cells, and the
colour picker and Pan/Tilt SHALL read and write the selected cells only (all of them under **All
cells**). For a fixture without cells the view SHALL look and behave as before.

#### Scenario: One cell's colour
- **GIVEN** a patched 8-pixel bar selected in the universe view
- **WHEN** the operator selects cell 3 and picks blue
- **THEN** cell 3 outputs blue and the other cells keep their values

#### Scenario: All cells
- **WHEN** the operator selects **All cells** and picks red
- **THEN** every cell outputs red

#### Scenario: Second head
- **GIVEN** a patched fixture with two heads, each with its own Pan and Tilt
- **WHEN** the operator selects the second head and moves Pan/Tilt
- **THEN** only the second head's Pan and Tilt channels change

### Requirement: The colour picker drives white
On a cell or fixture with a white channel, the colour picker SHALL write white as the smallest of
red, green and blue (DMX 0-255), and red, green and blue less that white. Reading the colour back
SHALL add white to each of red, green and blue (at most 255). Amber, UV and lime channels SHALL
stay as they are.

#### Scenario: RGBW pick
- **GIVEN** an RGBW fixture
- **WHEN** the operator picks red 255, green 128, blue 128
- **THEN** the fixture outputs white 128, red 127, green 0, blue 0, and the picker shows
  255, 128, 128
