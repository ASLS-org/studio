## ADDED Requirements

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
