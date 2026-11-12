# patching Specification

## Purpose

Defines how operators bring fixture types into a show and patch them into universes: the fixture
libraries (bundled Open Fixture Library, imported and bundled GDTF fixtures) and which fixtures
can be patched.

## Requirements

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
- **WHEN** the operator imports a file that is not a GDTF fixture, is damaged, or has no DMX
  mode
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

### Requirement: Patch bay lists universes
The patch bay SHALL list the show's universes only, without their fixtures. Clicking a universe
SHALL open it in the universe view. The filter SHALL match universe names.

#### Scenario: Demo show
- **GIVEN** the demo show
- **WHEN** the patch bay is shown
- **THEN** it lists the universe *Stage* with no fixture rows under it

#### Scenario: Open a universe
- **WHEN** the operator clicks a universe in the patch bay
- **THEN** the universe view opens on it

### Requirement: Add a universe
The patch bay's **New** button SHALL add an empty universe with an id one above the highest
existing id (0 in a show with none), named *Universe <id>*, and SHALL open it. Adding a universe
SHALL mark the show unsaved.

#### Scenario: New universe
- **GIVEN** a show with universes 0, 3 and 1, in that order
- **WHEN** the operator presses **New** in the patch bay
- **THEN** *Universe 4* appears in the patch bay and opens in the universe view

### Requirement: Delete universes
Deleting universes in the patch bay (select, <kbd>Delete</kbd>, confirm) SHALL delete each
selected universe and every fixture patched on it. Those fixtures SHALL also leave their groups,
scenes and effects, and the visualizer. The confirmation SHALL name the number of fixtures that
will be removed. A deleted universe's stream SHALL stop, and its connection SHALL stay in the
show. If the deleted universe was open, the universe view SHALL close.

#### Scenario: Delete a patched universe
- **GIVEN** universe *Stage* with 4 fixtures, all in group *Rig*
- **WHEN** the operator deletes *Stage* in the patch bay and confirms
- **THEN** *Stage* and its 4 fixtures are gone from the patch bay, the group, its cues and the
  visualizer, and the show is marked unsaved

#### Scenario: Save and reload
- **GIVEN** a show with an output, whose universe was deleted
- **WHEN** the show is saved and opened again
- **THEN** it loads without error, with the output in its connections

### Requirement: Fixtures keep their ids
A fixture loaded from a show SHALL keep its saved id, so its universe, groups and scenes find it
whatever fixtures were deleted before the save. A new fixture SHALL get an id one above the
highest existing id.

#### Scenario: Delete then reopen
- **GIVEN** the demo show, whose first fixture is deleted
- **WHEN** the show is saved and opened again
- **THEN** every remaining fixture is in its universe, group and scenes, with no error
