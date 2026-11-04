## ADDED Requirements

### Requirement: Effects save their cell phase option
The showfile SHALL save each effect channel's **Across cells** option. A showfile without it
SHALL open with the option off. Selecting cells in the universe or scene view SHALL NOT change
the showfile nor mark the show as unsaved.

#### Scenario: Round trip
- **GIVEN** an effect channel with **Across cells** on
- **WHEN** the show is saved and opened again
- **THEN** the option is still on

#### Scenario: Cell selection
- **WHEN** the operator selects another cell in the scene view without editing a value
- **THEN** the show stays saved (no `*`)
