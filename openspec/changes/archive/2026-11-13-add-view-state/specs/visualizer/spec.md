## MODIFIED Requirements

### Requirement: Selection highlights fixtures in the view
The system SHALL highlight in the 3D view exactly the fixtures selected in the panel in view
(the universe fixture pool, the group's fixture pool, or the scene's fixtures), and SHALL attach
the move/rotate gizmo to them when the selection asks for it. When the panel in view changes,
or a selected fixture is deleted, the highlight and the gizmo SHALL follow at once: no fixture
SHALL stay highlighted from a panel that is no longer in view.

#### Scenario: Select two fixtures
- **WHEN** the operator selects two fixtures in the universe fixture pool
- **THEN** both are highlighted in the 3D view and the gizmo is attached to them

#### Scenario: Switch from a universe to a group
- **GIVEN** fixture 3 selected in universe 0, and group 1 whose remembered selection is
  fixtures 5 and 6
- **WHEN** the operator opens group 1
- **THEN** fixtures 5 and 6 are highlighted, and fixture 3 no longer is

#### Scenario: Delete a highlighted fixture
- **GIVEN** fixtures 3 and 5 selected and highlighted
- **WHEN** the operator deletes fixture 3
- **THEN** only fixture 5 stays highlighted
