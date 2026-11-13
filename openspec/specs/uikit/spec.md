# uikit Specification

## Purpose

Defines how widgets that display live values (channel faders, pan/tilt, colour, cue progress, chase
playheads, activity meters) follow playback and operator edits without slowing the show down.

## Requirements

### Requirement: Live-value widgets follow playback
The system SHALL refresh every visible widget that displays live values at least 20 times per
second while values change, and SHALL NOT tie widget refreshes to the number of running cues or
to the engine's tick rate.

#### Scenario: Watch an effect on the selected fixture
- **GIVEN** a fixture selected in the universe view while a pan effect runs on it
- **WHEN** the operator watches the channel faders and the pan/tilt widget
- **THEN** both move smoothly with the effect

#### Scenario: Cue progress and playheads
- **GIVEN** a looping scene and a running chase
- **WHEN** the operator looks at the cue pool and the chase timeline
- **THEN** the cue's progress bar and the chase playhead advance continuously, and play icons
  switch off when a one-shot cue or chase ends

### Requirement: Cues played by a chase show as playing
The system SHALL show a cue as playing in the cue pool, and count its DMX activity in the group's
activity meter, while a running chase is playing one of that cue's items, exactly as when the cue
is triggered directly.

#### Scenario: Chase plays a scene
- **GIVEN** a chase whose timeline holds a scene item over bars 1-2 and nothing over bars 3-4
- **WHEN** the chase loops at 120 BPM
- **THEN** the scene shows as playing in the cue pool during bars 1-2 and not during bars 3-4
- **AND** the group's activity meter rises while the scene item plays

### Requirement: Operator edits show immediately
The system SHALL update a live-value widget in the same frame the operator changes a value
through it (fader drag, colour pick, pan/tilt drag), without waiting for the next periodic
refresh.

#### Scenario: Drag a fader while stopped
- **GIVEN** the show is stopped
- **WHEN** the operator drags a Dimmer fader
- **THEN** the fader and its value follow the pointer with no visible lag

### Requirement: Lists keep row state while their items change
A list SHALL keep each row's selection, highlight, check and unfolded state, matched by the
item's id (else its name), when its items change or a search filters them. Rows whose item is
gone SHALL leave the selection. A row whose id or name changes in place SHALL keep its state.

#### Scenario: Patch while a universe is unfolded
- **GIVEN** universe 0 unfolded in the patch bay
- **WHEN** the operator patches, deletes or renames a fixture, or adds a universe
- **THEN** universe 0 stays unfolded and the remaining selection is unchanged

#### Scenario: Change a universe's id
- **GIVEN** universe 0 unfolded in the patch bay
- **WHEN** the operator changes its id in the universe settings
- **THEN** it stays unfolded

#### Scenario: Check during a search
- **GIVEN** a checkable list with "Aura" typed in its search box
- **WHEN** the operator checks a row and clears the search
- **THEN** that row is still checked

### Requirement: Lists take focus and keys like the browser
Clicking a row SHALL focus its list. Only the focused list SHALL react to keys. After a delete
confirmation closes, the list SHALL have focus again.

#### Scenario: Delete twice in a row
- **GIVEN** a deletable list
- **WHEN** the operator deletes a row, clicks another row and presses Delete
- **THEN** the confirmation opens for that row

#### Scenario: Two lists on screen
- **GIVEN** the patch bay and the universe view's fixture pool both have a selection
- **WHEN** the operator clicks in the fixture pool and presses Escape
- **THEN** only the fixture pool clears its highlights

### Requirement: List selection
Click SHALL select one row. Ctrl+click (⌘+click on macOS) SHALL add the row to, or remove it
from, the selection. Shift+click SHALL select the range from the selected row to the clicked row
when both are at the same level, else select the clicked row alone. Up and Down arrows SHALL
move the selection to the previous or next visible row. No selection gesture SHALL raise an
error.

#### Scenario: Range of fixtures in a universe
- **GIVEN** a fixture selected in an unfolded universe of the patch bay
- **WHEN** the operator Shift+clicks a fixture three rows below
- **THEN** the four fixtures are selected

#### Scenario: Range across levels
- **GIVEN** a fixture of universe 0 selected in a list where universes 0 and 1 are unfolded
- **WHEN** the operator Shift+clicks a fixture of universe 1
- **THEN** only that fixture is selected

### Requirement: Checkable lists
On a checkable list, clicking a row or its checkbox SHALL flip that row's check exactly once.
**Check All** SHALL show the current count and check or uncheck every row it covers. Disabled
rows SHALL not change.

#### Scenario: Click the checkbox
- **GIVEN** an unchecked row in the group creation popup
- **WHEN** the operator clicks its checkbox
- **THEN** the row is checked and the selection count goes up by one

### Requirement: Reorder by dragging a handle
On a list that allows reordering, each top-level row SHALL show a grip handle. Dragging the
handle SHALL lift the row so it follows the pointer, while the other rows slide apart to show
where it will land. Releasing SHALL apply the new order. Escape, or releasing at the starting
place, SHALL leave the order unchanged. Pressing a row outside its handle SHALL not drag. Handles
SHALL be hidden and reordering off while a search is typed.

#### Scenario: Move a fixture in a pool
- **GIVEN** a universe's fixture pool
- **WHEN** the operator drags the first fixture's handle below the third fixture and releases
- **THEN** while dragging, the fixture follows the pointer and a gap opens below the third row;
  after release, the pool's order has the fixture in third place

### Requirement: Row trash icon
On a list that allows deleting, each row SHALL show a trash icon at its right, before the grip
handle when there is one. Clicking it SHALL open the delete confirmation for the highlighted rows
when the row is one of several highlighted rows, else for that row alone, without changing the
selection. On a selected or highlighted row, the trash and grip icons SHALL take the colour of
the row's label.

#### Scenario: Delete from the trash icon
- **WHEN** the operator clicks the trash icon of a fixture row in the patch bay and confirms
- **THEN** that fixture is removed from the show and its row disappears

#### Scenario: Delete a selection from the trash icon
- **GIVEN** three highlighted fixtures in a fixture pool
- **WHEN** the operator clicks the trash icon of one of them
- **THEN** the confirmation lists the three fixtures

### Requirement: Delete confirmation
The delete confirmation SHALL list up to five of the rows to delete, and how many more, in
Studio's popup text style.

#### Scenario: Delete three fixtures
- **WHEN** the operator selects three fixtures and presses Delete
- **THEN** the confirmation names the three fixtures in Studio's popup text style

### Requirement: List unfolding and empty space
Unfolding a row SHALL reveal its sub-rows with a short height and fade animation of at most
200 ms. Space below the last row SHALL show the idle stripes background. In an accordion list,
the unfolded row SHALL take the space left, with the rows after it at the bottom of the list.

#### Scenario: Short list
- **GIVEN** a list with three rows in a tall widget
- **WHEN** the operator looks at it
- **THEN** the area below the third row is striped

#### Scenario: Open a universe in the patch bay
- **GIVEN** four universes in the patch bay, the second holding one fixture
- **WHEN** the operator unfolds the second universe
- **THEN** the third and fourth universes sit at the bottom of the patch bay, with stripes
  between the fixture and them

### Requirement: Popups stack
Open popups SHALL form one stack: a popup opened from another opens on top of it. Escape SHALL
close only the top popup, and Enter SHALL submit only the top popup. Opening a panel, or a
show load, SHALL close the popups that belong to the panel left behind.

#### Scenario: Error over a popup
- **GIVEN** the universe patch popup is open
- **WHEN** an error is reported while it is open (for example a fixture file that fails to
  import), and the operator presses Escape
- **THEN** only the error popup closes, and the universe patch popup is still open

#### Scenario: Switch panel with a popup open
- **GIVEN** the universe patch popup is open
- **WHEN** the operator opens a group from the group pool
- **THEN** the universe patch popup closes

### Requirement: Keys go to one place
A key press SHALL be handled by exactly one place, the first of:
1. the top popup;
2. the focused panel or list;
3. the app's global shortcuts.

While a text field has focus, typing SHALL reach only that field. A key no one handles SHALL do
nothing.

#### Scenario: Delete with a popup open
- **GIVEN** a fixture selected in the universe fixture pool and the patch popup open
- **WHEN** the operator presses Delete
- **THEN** no fixture is deleted

#### Scenario: Delete in the focused block only
- **GIVEN** a group selected in the group pool and a fixture selected in the universe fixture
  pool
- **WHEN** the operator clicks in the fixture pool and presses Delete
- **THEN** only the fixture's delete confirmation opens

#### Scenario: Global shortcut
- **GIVEN** no popup open and no text field focused
- **WHEN** the operator presses the toolbar's save shortcut
- **THEN** the show is saved, whichever panel is in view
