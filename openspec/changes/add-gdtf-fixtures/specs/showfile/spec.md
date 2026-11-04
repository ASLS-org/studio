## ADDED Requirements

### Requirement: Showfiles reference GDTF fixtures
The system SHALL save patched GDTF fixtures in the showfile by their GDTF fixture type, without
embedding the fixture file, and SHALL reopen them from this device's fixture library or the
bundled fixtures. Older showfiles SHALL open unchanged.

#### Scenario: Save and reopen
- **GIVEN** a show with a patched imported GDTF fixture in a group with a scene
- **WHEN** the operator saves and reloads the show
- **THEN** the fixture, its mode, address, position, group and scene values are restored

### Requirement: Missing fixtures on open
When a showfile references GDTF fixtures that are neither in this device's library nor bundled,
the system SHALL list them before opening the show and let the operator import them or open the
show without them. A show opened without them SHALL keep their patch, group and scene data, so
saving it and opening it later with the fixtures imported restores them.

#### Scenario: Import the missing fixture
- **GIVEN** a showfile with a GDTF fixture that this device's library does not have
- **WHEN** the operator opens it and imports the matching `.gdtf` file in the Missing fixtures
  popup
- **THEN** the show opens with that fixture patched as saved

#### Scenario: Open without, then restore
- **GIVEN** the operator chose Open anyway for a missing fixture
- **WHEN** they save the show, import the fixture, and reopen the saved file
- **THEN** the fixture is back with its address, groups and scene values

#### Scenario: Address stays reserved
- **GIVEN** a show opened without a missing fixture at universe 1 address 1-16
- **WHEN** the operator patches a new fixture
- **THEN** addresses 1-16 of universe 1 are not offered as free

#### Scenario: Not marked unsaved
- **WHEN** a show is opened without its missing fixtures
- **THEN** the unsaved marker does not appear until the operator edits something
