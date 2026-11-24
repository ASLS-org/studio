## ADDED Requirements

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
