## ADDED Requirements

### Requirement: Import GDTF fixtures
The system SHALL let the operator import `.gdtf` files from the universe patch popup, through a
file picker or by dropping files on it, into a fixture library kept on this device. An imported
fixture SHALL stay available across reloads and across shows. Importing a file for a fixture type
already in the library SHALL keep a single entry, with the newer revision.

#### Scenario: Import a fixture
- **WHEN** the operator imports a valid `.gdtf` file in the universe patch popup
- **THEN** the fixture appears under Imported with its manufacturer and name, and its DMX modes
  can be chosen

#### Scenario: Library survives a reload
- **GIVEN** a GDTF fixture imported earlier
- **WHEN** the page is reloaded and another show is opened
- **THEN** the fixture is still listed under Imported

#### Scenario: Invalid file
- **WHEN** the operator imports a file that is not a GDTF fixture, or has no DMX mode
- **THEN** an error says why, and the library is unchanged

### Requirement: Bundled generic GDTF fixtures
The system SHALL list generic GDTF fixtures that ship with the app (a PAR, a spot and a wash
moving head, a pixel bar and a multi-beam bar) under Bundled in the universe patch popup, ready to
patch without importing. The bundle SHALL contain no third-party fixture files.

#### Scenario: Patch a bundled fixture
- **WHEN** the operator selects the generic spot under Bundled and patches it
- **THEN** it is patched like an imported fixture, with its pan/tilt, colour wheel, gobo wheel and
  zoom channels

### Requirement: Fixtures of any category can be patched
The system SHALL patch fixtures of any category from the OFL library and from GDTF, not only
moving heads.

#### Scenario: Patch a PAR
- **WHEN** the operator patches an OFL fixture whose category is `Color Changer`
- **THEN** it is patched at the chosen DMX address and its channels play like any fixture's
