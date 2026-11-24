## ADDED Requirements

### Requirement: One panel in view
The modifier strip SHALL show exactly one panel at a time: a universe, a group (with its
selected cue), or a chase. Every part of the app SHALL agree on which universe, group, cue,
chase and fixtures are in view: the patch bay, the group pool, the modifier strip and the 3D
view show the same selection after every click, delete or show load.

#### Scenario: Open a group from the group pool
- **GIVEN** universe 0 in view
- **WHEN** the operator clicks group 1 in the group pool
- **THEN** the modifier strip shows group 1, the group pool marks group 1 as selected, and the
  patch bay no longer marks universe 0 as the panel in view

#### Scenario: Open a chase
- **WHEN** the operator clicks a chase cell of group 0 in the group pool
- **THEN** the modifier strip shows that chase, and group 0 is the selected group

### Requirement: Selection memory per group and universe
For the rest of the session, each group SHALL remember its selected cue and fixtures, and each
universe its selected fixture and cells. Opening a group or universe again SHALL bring back
what was selected there. A group or universe opened for the first time SHALL show its first cue
or fixture. The memory SHALL not be saved: reloading the app or loading a show starts afresh.

#### Scenario: Come back to a group
- **GIVEN** group 0 in view with cue 4 selected and fixtures 3 and 5 selected in its fixture
  pool
- **WHEN** the operator opens group 1, then group 0 again
- **THEN** group 0 shows cue 4, with fixtures 3 and 5 selected

#### Scenario: Come back to a universe
- **GIVEN** universe 0 in view with fixture 7 selected and cell B selected
- **WHEN** the operator opens a group, then universe 0 again
- **THEN** fixture 7 is selected with cell B

#### Scenario: Reload
- **WHEN** the operator reloads the app
- **THEN** the first universe is in view with its first fixture selected

### Requirement: Lists of the same fixtures share one selection
In a group, the group's fixture pool and the scene's fixture list SHALL show the same fixture
selection: selecting fixtures in one SHALL select them in the other. Only the list that has
focus SHALL show its selected rows in the focused style. The other list SHALL show the same
rows as selected but unfocused.

#### Scenario: Select in the scene's fixture list
- **GIVEN** group 0 in view with a scene selected
- **WHEN** the operator clicks fixture 5 in the scene's fixture list
- **THEN** fixture 5 is selected in both lists; the scene's list shows it in the focused style
  and the group's fixture pool shows it as selected but unfocused

#### Scenario: Focus moves to the other list
- **GIVEN** fixture 5 selected in both lists, with the scene's list focused
- **WHEN** the operator clicks in the group's fixture pool
- **THEN** the fixture pool shows its selection in the focused style and the scene's list shows
  it as selected but unfocused

### Requirement: Deleted items leave the view
When the item in view or a selected item is deleted, the view SHALL fall back without an error:
- a deleted fixture leaves the selection;
- a deleted cue is replaced by the group's first cue, or by no cue;
- a deleted chase or group is replaced by the first group, or by the first universe when no
  group is left;
- a deleted universe is replaced by the first universe.

No panel SHALL keep showing a deleted item.

#### Scenario: Delete the cue in view
- **GIVEN** group 0 in view with cue 4 selected
- **WHEN** the operator deletes cue 4
- **THEN** the group's first remaining cue is shown, and no error is reported

#### Scenario: Delete the group in view
- **GIVEN** group 2 in view
- **WHEN** the operator deletes group 2
- **THEN** the first group is in view

#### Scenario: Delete a selected fixture from the patch bay
- **GIVEN** universe 0 in view with fixture 3 selected
- **WHEN** the operator deletes fixture 3 from the patch bay
- **THEN** universe 0's first remaining fixture is selected and its controls are shown

### Requirement: Switching panels doesn't block playback
Opening a universe, group, cue or chase SHALL not block the app for longer than 50 ms, from
the first view after the show is loaded onward, so that playback and DMX output keep their
timing while the operator navigates.

#### Scenario: First group view during a show
- **GIVEN** a show loaded and cues playing, with no group opened yet
- **WHEN** the operator opens a group
- **THEN** the group's panel appears without any pause longer than 50 ms, and the playing cues'
  output keeps its timing
