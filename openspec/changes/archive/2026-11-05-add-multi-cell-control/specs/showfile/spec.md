## ADDED Requirements

### Requirement: Effects save their cell phase option
The showfile SHALL save each effect channel's **Spread over** option. A showfile without it
SHALL open with **Fixtures**. Selecting cells in the universe or scene view SHALL NOT change
the showfile nor mark the show as unsaved.

#### Scenario: Round trip
- **GIVEN** an effect channel with **Spread over** set to **Cells**
- **WHEN** the show is saved and opened again
- **THEN** it is still set to **Cells**

#### Scenario: Cell selection
- **WHEN** the operator selects another cell in the scene view without editing a value
- **THEN** the show stays saved (no `*`)
