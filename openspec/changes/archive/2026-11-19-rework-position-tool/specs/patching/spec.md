## ADDED Requirements

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
