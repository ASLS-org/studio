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

### Requirement: Deleting a fixture always completes
Deleting a fixture SHALL remove it from the show, its universe's patch, every group and the
visualizer, even when one of its groups' cues fails to drop it. Such a failure SHALL be reported
and SHALL NOT leave the fixture in the group.

#### Scenario: A cue fails while deleting
- **GIVEN** a fixture used by a group whose cue raises an error when the fixture is dropped
- **WHEN** the operator deletes the fixture
- **THEN** the fixture leaves the group, the universe and the visualizer, and the show saves and
  reopens without error

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

### Requirement: Addresses show 1 to 512
The system SHALL show every DMX address as the DMX address, 1 to 512 (the patch bay, Fixture
Settings, the patch popup and the universe maps), and SHALL keep storing addresses as before in
showfiles.

#### Scenario: Demo show
- **GIVEN** the demo show, whose first fixture is stored at address 0 of universe 0
- **WHEN** the operator unfolds universe 0 in the patch bay and selects that fixture
- **THEN** its row reads `U0 - CH1` and Fixture Settings' *Start* reads 1

### Requirement: Repatch fixtures on a universe map
The system SHALL show Fixture Settings' *Ch Start*, *Ch Stop* and *Ch Count* read-only with an *Edit*
header button opening a popup with a map of a universe's 512 addresses, each patched fixture
drawn as a block over its range with its name and range. The operator SHALL be able to choose the
universe shown, select blocks (Ctrl/⌘ or Shift to add), and drag the selection to a new address,
snapping to addresses, never past address 1 or 512 and never onto another fixture. Changes SHALL apply only on *OK*; *Cancel*
SHALL leave the patch unchanged.

#### Scenario: Drag a fixture to a free range
- **GIVEN** universe 0 with fixtures at 1–14 and 15–28 and nothing after
- **WHEN** the operator opens *Repatch* from the second fixture, drags its block to address 101 and
  presses *OK*
- **THEN** the changes list shows `15–28 → 101–114`; after *OK* the fixture outputs at 101–114,
  Fixture Settings reads *Start* 101, addresses 15–28 are free for a new patch, and the unsaved
  marker appears

#### Scenario: Cancel
- **GIVEN** the same popup after a drag
- **WHEN** the operator presses *Cancel*
- **THEN** every fixture keeps its address

#### Scenario: Drag onto another fixture
- **GIVEN** the popup
- **WHEN** the operator drags a block over another fixture's range
- **THEN** the block stops where it last fitted and no two fixtures overlap

#### Scenario: Drag past the end
- **GIVEN** the popup
- **WHEN** the operator drags a block beyond the bottom-right of the map
- **THEN** the block stops with its last address at 512

#### Scenario: Another universe
- **GIVEN** a fixture of universe 0 that belongs to a group with a scene setting it
- **WHEN** the operator picks universe 1 in the popup, drops the fixture at a free address there
  and presses *OK*
- **THEN** the fixture is listed under universe 1 at that address, outputs there, and the group
  and scene still drive it

### Requirement: The repatch popup explains the draft
While the repatch popup is open, the system SHALL highlight the selected fixtures in the 3D view,
list each moved fixture with its addresses before and after, and warn about each fixture moving
to another universe.

#### Scenario: Selection in 3D
- **GIVEN** the repatch popup opened from a fixture
- **WHEN** the operator selects another block
- **THEN** the 3D view highlights that fixture, and the panel's selection again once the popup
  closes

### Requirement: Move to free range and remove gaps
The repatch popup SHALL offer *Move to free range*, moving the selected fixtures, in order, to the
first free range of the shown universe that fits them all, *Remove gaps*, packing the shown
universe's fixtures from address 1 in their address order, and *Reset*, restoring the patch. Each
SHALL be disabled when it would change nothing.

#### Scenario: Remove gaps
- **GIVEN** a universe with 14-channel fixtures at 1, 40 and 200
- **WHEN** the operator presses *Remove gaps* then *OK*
- **THEN** they are at 1, 15 and 29

### Requirement: The patch popup shows the universe map
The system SHALL show in the patch popup the same map, read-only, with the new fixtures drawn as
ghost blocks (the patched style, fainter) where they would go, in red when it overlaps a fixture or passes address 512, with a message
naming the fixtures holding it or the limit passed. Several identical fixtures patched at once
SHALL be named with a number after the name (`Spot 1`, `Spot 2`).

#### Scenario: Taken range
- **GIVEN** the patch popup on universe 0 with a fixture at 1–14
- **WHEN** the operator sets *Address* 10 for a 14-channel fixture
- **THEN** the map shows 10–23 in red, a message names the fixture at 1–14, and the popup can't
  be submitted

#### Scenario: Several identical fixtures
- **GIVEN** the patch popup with a PAR loaded
- **WHEN** the operator sets *Amount* 2 and presses *OK*
- **THEN** the fixtures are named `<PAR name> 1` and `<PAR name> 2`

### Requirement: Invert and swap pan and tilt
The engine SHALL support per fixture *Invert pan*, *Invert tilt* and *Swap pan/tilt* (their
controls come later), saved with the show (off for fixtures of older showfiles). Invert SHALL output 255 minus
the value on the pan (or tilt) channel and its fine channel; swap SHALL output the pan values on
the tilt channels and the tilt values on the pan channels. Faders, scenes and effects SHALL keep
the programmed values; the visualizer SHALL follow the output.

#### Scenario: Invert pan
- **GIVEN** a moving head with 16-bit pan at pan 64, pan fine 0
- **WHEN** its *Invert pan* option is set
- **THEN** the fixture outputs 191 and 255 on pan and pan fine, its pan fader still reads 64, and
  the visualizer turns it to the mirrored position

#### Scenario: Older showfile
- **GIVEN** a showfile saved before these options
- **WHEN** it is loaded
- **THEN** every fixture has the three options off and outputs as before

### Requirement: The patch map stays consistent
The system SHALL keep a universe's record of which fixture owns each address in step with every
patch, unpatch, mode change and repatch, so a freed range can be patched and a taken range can't.
A range SHALL count as taken when any fixture, the one at the first address included, uses it.

#### Scenario: Address 1 counts
- **GIVEN** a fixture at address 1 (stored 0)
- **WHEN** the operator tries to patch another fixture at address 1 in the patch popup
- **THEN** the range shows red and the popup can't be submitted
