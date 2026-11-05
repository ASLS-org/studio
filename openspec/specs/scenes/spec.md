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
