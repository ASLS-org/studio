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

### Requirement: The Position Tool edits every selected fixture
The system SHALL apply the Position Tool to every selected fixture of the universe in view and
show how many are selected. Its fields (X, Y and Height in metres; Turn and Tilt in degrees)
SHALL show the value when all selected fixtures share it and `--` otherwise. A typed value SHALL
set it on every selected fixture; an arrow step SHALL add or remove one step from each fixture's
own value.

#### Scenario: Mixed values
- **GIVEN** two fixtures selected, at X = −2 and X = 2, both at height 4
- **THEN** X shows `--` and Height shows 4

#### Scenario: Typing on several fixtures
- **WHEN** the operator types 6 in Height
- **THEN** both fixtures are at height 6 and X keeps −2 and 2

#### Scenario: Nudging keeps spacing
- **WHEN** the operator presses the X up arrow (step 0.1)
- **THEN** the fixtures are at X = −1.9 and 2.1

### Requirement: Stage map
The Position Tool SHALL show the stage from above, the back at the top: a dot per fixture of the
universe, the selected ones highlighted, fixtures of other universes faint, and a short line for
a beam that isn't vertical. A click SHALL select a fixture (Ctrl/⌘/Shift adds or removes);
dragging SHALL move every selected fixture by the same step, the pressed one landing on a 0.25 m
grid (Alt: freely).

#### Scenario: Dragging the selection
- **GIVEN** four fixtures selected, in a row at Y = 0
- **WHEN** the operator drags one dot toward the back right
- **THEN** all four move by the same X and Y, on the 0.25 m grid, and keep their height

### Requirement: Mount, turn and tilt
The Position Tool SHALL show the rotation as a mount (floor, hung, left wall, right wall, back
wall, front), a turn on the base and a tilt of the beam. The selection's shared mount SHALL be
lit. Picking a mount SHALL keep each fixture's turn and tilt.

#### Scenario: Floor keeps the turn
- **GIVEN** fixtures hung (rotation X 180) and turned 30°
- **WHEN** the operator picks Floor
- **THEN** Hung was lit, and each fixture now stands with rotation (0, 0, 30)

### Requirement: Arrange the selection
The system SHALL open an *Arrange* popup from the Position Tool header or the **A** key while the
universe view has the focus and fixtures are selected. It SHALL offer these modes, placing the
fixtures in fixture pool order:

| Mode | Places the fixtures |
|---|---|
| Line | evenly along X, Y or Z, at a spacing, around a centre |
| Grid | in rows of N columns, at X and Y spacings, around a centre |
| Circle | evenly on a circle (floor or upright), radius and centre, facing in, out or unchanged |
| Arc | as Circle, between a start and an end angle |
| Align | at the minimum, centre or maximum of the selection on X, Y or Z |
| Distribute | evenly between the two outermost fixtures on X, Y or Z |
| Fan | rotation spread evenly from −angle to +angle about an axis |
| Aim | each fixture rotated to point its beam at a point X, Y, Z |

The fixtures SHALL move in the 3D view as the settings change. *Apply*, greyed out until a
setting or the mode changes, SHALL keep the result with the popup open, so the next mode starts
from it. *OK* SHALL keep the result and close; *Cancel* or Escape SHALL restore every fixture's
pose from the opening or the last *Apply*. The mode list SHALL have a search box.

#### Scenario: Line
- **GIVEN** four fixtures selected
- **WHEN** the operator picks Line on X, spacing 2 m, centre 0, and presses *OK*
- **THEN** they are at X = −3, −1, 1 and 3, in fixture pool order

#### Scenario: Cancel restores
- **WHEN** the operator picks Circle, then presses *Cancel*
- **THEN** every fixture is back at its position and rotation from before the popup

#### Scenario: Apply then Cancel
- **WHEN** the operator changes a setting, presses *Apply*, then *Cancel*
- **THEN** *Apply* was greyed out before the change, and the fixtures stay where *Apply* left them

#### Scenario: Aim
- **WHEN** the operator picks Aim at (0, 0, 0) for fixtures hung at Z = 4 and presses *OK*
- **THEN** each fixture's beam points at the stage centre in the 3D view

### Requirement: New fixtures are placed in a line

When fixtures are patched, Studio SHALL place them in a line along X, 1 m apart and centred on
X 0. They SHALL be hung 4 m up (mount Hung), except fixtures of the categories Smoke, Hazer, Fan
and Stand, which SHALL stand on the floor (height 0, mount Floor).

#### Scenario: Two PARs patched into the demo rig
- **WHEN** the operator patches two PARs into the demo show (heads hung at 11.5 m)
- **THEN** they appear at X −0.5 and 0.5 m, Y −3 m, height 4 m, hung, and the Position Tool shows
  the mount Hung

#### Scenario: A smoke machine stands on the floor
- **WHEN** the operator patches a fixture of category Smoke on an empty stage
- **THEN** it stands on the floor (height 0, mount Floor) at Y 3 m

### Requirement: New fixtures take a free row

The line SHALL go on the first free row: Y −3, 0, 3, −6, 6, 9 m for hung fixtures, Y 3, 5, 1, 7 m
for floor fixtures. A row is free when no fixture of any universe on it (within 0.5 m of its Y
and 1 m of its height) is within 0.5 m of the line. When no row is free, the line SHALL continue
on the first row, 1 m right of its rightmost fixture.

#### Scenario: A second patch takes the next row
- **WHEN** four moving heads were patched on an empty stage and then two more fixtures are patched
- **THEN** the four are at X −1.5 to 1.5 m on Y −3 m and the two at X −0.5 and 0.5 m on Y 0 m,
  all 4 m up

#### Scenario: Every row taken
- **WHEN** every hung row already holds a fixture at X 0 and two more fixtures are patched
- **THEN** they go on Y −3 m at X 1 and 2 m, right of the fixture already there
