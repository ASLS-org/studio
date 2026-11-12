## ADDED Requirements

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
