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

### Requirement: Add a universe from the patch bay
The patch bay's **New** button SHALL open the **New Media** popup, which asks for a **Type**
(only **DMX Universe** so far), a **Name** and a **Color**. **OK** SHALL add an empty universe
with an id one above the highest existing id (0 in a show with none), list it in the patch bay,
open it in the universe view and mark the show unsaved. The popup SHALL propose *Universe <id>*
as the name.

#### Scenario: New universe
- **GIVEN** a show with universes 0, 3 and 1, in that order
- **WHEN** the operator presses **New** in the patch bay, keeps **DMX Universe** and presses **OK**
- **THEN** *Universe 4* appears in the patch bay and opens in the universe view

### Requirement: Delete fixtures from the patch bay
Deleting in the patch bay (select fixture rows, <kbd>Delete</kbd>, confirm) SHALL delete the
selected fixtures from the show, as the universe view's fixture pool does: they also leave their
groups, scenes and effects, and the visualizer. Universes in the selection SHALL be left in the
show.

#### Scenario: Delete a fixture
- **GIVEN** the demo show
- **WHEN** the operator selects *MAC Aura 4* under its universe in the patch bay, presses
  <kbd>Delete</kbd> and confirms
- **THEN** *MAC Aura 4* leaves the patch bay, the universe view, its groups and the visualizer

### Requirement: Fixtures keep their ids
A fixture loaded from a show SHALL keep its saved id, so its universe, groups and scenes find it
whatever fixtures were deleted before the save. A new fixture SHALL get an id one above the
highest existing id.

#### Scenario: Delete then reopen
- **GIVEN** the demo show, whose first fixture is deleted
- **WHEN** the show is saved and opened again
- **THEN** every remaining fixture is in its universe, group and scenes, with no error

### Requirement: Universe id edits keep their fixtures
Changing a universe's ID SHALL carry its fixtures along: they stay patched in it, and deleting,
selecting or moving them keeps working. An ID another universe already uses SHALL be refused, and
the field SHALL show the universe's current ID again.

#### Scenario: Delete after changing the id
- **GIVEN** universe 0 renumbered to 5 in its settings
- **WHEN** the operator deletes one of its fixtures from the patch bay
- **THEN** the fixture disappears from the patch bay, the universe view and the visualizer

#### Scenario: Id already in use
- **GIVEN** universes 0 and 1
- **WHEN** the operator types 1 as universe 0's ID
- **THEN** the field goes back to 0 and both universes keep their fixtures

### Requirement: Deleting a fixture always completes
Deleting a fixture SHALL remove it from the show, its universe's patch, every group and the
visualizer, even when one of its groups' cues fails to drop it. Such a failure SHALL be reported
and SHALL NOT leave the fixture in the group.

#### Scenario: A cue fails while deleting
- **GIVEN** a fixture used by a group whose cue raises an error when the fixture is dropped
- **WHEN** the operator deletes the fixture
- **THEN** the fixture leaves the group, the universe and the visualizer, and the show saves and
  reopens without error
