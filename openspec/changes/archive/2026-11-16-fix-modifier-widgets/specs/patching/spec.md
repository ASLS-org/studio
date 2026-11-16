## ADDED Requirements

### Requirement: A universe's ID is fixed
A universe SHALL keep the ID it gets when it is created (or that its showfile gives it) for as
long as it exists. The universe settings SHALL show the ID in a disabled field that can't be
edited. The universe's output SHALL keep sending to that ID.

#### Scenario: The ID field can't be edited
- **GIVEN** universe 0 open in the universe view
- **WHEN** the operator clicks its ID field and types 7
- **THEN** the field stays at 0, shown disabled, and the patch bay still lists Universe 0

#### Scenario: Saved IDs load unchanged
- **GIVEN** a showfile whose universes have IDs 0 and 5
- **WHEN** it is opened
- **THEN** the universe settings show 0 and 5

## REMOVED Requirements

### Requirement: Universe id edits keep their fixtures
**Reason**: A universe's ID can no longer be changed.
**Migration**: None. Showfiles keep their saved IDs.
