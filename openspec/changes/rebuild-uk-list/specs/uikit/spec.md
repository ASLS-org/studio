# Spec Delta

## ADDED Requirements

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

### Requirement: List context menu
Right-clicking a row SHALL open a context menu at the pointer, styled as Studio's menus, after
selecting the row unless it is already part of the selection. The menu SHALL offer, where the
list allows them: **Move up** and **Move down** (reorderable lists), **Select all** (the row's
level, lists with multi-selection) and **Delete** (deletable lists, for the selection, after the
usual confirmation). Escape, a click elsewhere, scrolling or choosing an entry SHALL close it.

#### Scenario: Delete from the context menu
- **WHEN** the operator right-clicks a fixture row in the patch bay, chooses **Delete** and
  confirms
- **THEN** that fixture is removed from the show and its row disappears

#### Scenario: Move with the context menu
- **WHEN** the operator right-clicks the second fixture of a fixture pool and chooses **Move up**
- **THEN** it becomes the first fixture

### Requirement: Delete confirmation
The delete confirmation SHALL list up to five of the rows to delete, and how many more, in
Studio's popup text style.

#### Scenario: Delete three fixtures
- **WHEN** the operator selects three fixtures and presses Delete
- **THEN** the confirmation names the three fixtures in Studio's popup text style

### Requirement: List unfolding and empty space
Unfolding a row SHALL reveal its sub-rows with a short height and fade animation of at most
200 ms. Space below the last row SHALL show the idle stripes background.

#### Scenario: Short list
- **GIVEN** a list with three rows in a tall widget
- **WHEN** the operator looks at it
- **THEN** the area below the third row is striped
