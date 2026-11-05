# Spec Delta

## Purpose

Defines what the 3D visualizer shows and how operators select and place fixtures in it, so the view
always matches what the hardware receives and fixture placement stays reliable.

## ADDED Requirements

### Requirement: The view shows the output values
The system SHALL render every patched fixture from the DMX values its universe outputs (0-255 per
channel), within one rendered frame of those values changing, whether they come from playback or
from operator edits, and whether the show is playing, paused or stopped.

#### Scenario: Effect on a dimmer
- **GIVEN** a group of moving heads with a dimmer effect looping at 120 BPM
- **WHEN** the show plays
- **THEN** each fixture's beam intensity in the 3D view follows its Dimmer channel value

#### Scenario: Fader edit while paused
- **GIVEN** the show is paused
- **WHEN** the operator drags a fixture's Pan fader in the universe view
- **THEN** the fixture's head turns in the 3D view as the fader moves

### Requirement: Selection highlights fixtures in the view
The system SHALL highlight the fixtures selected in the fixture pool, group or scene editors in the
3D view, and SHALL attach the move/rotate gizmo to them when the selection asks for it.

#### Scenario: Select two fixtures
- **WHEN** the operator selects two fixtures in the universe fixture pool
- **THEN** both are highlighted in the 3D view and the gizmo is attached to them

### Requirement: Placement edits stay in sync
The system SHALL apply a fixture move or rotation made with the gizmo to the fixture's saved
position and rotation, and a value typed in the position tool to the 3D view, in centimetres and
whole degrees.

#### Scenario: Move with the gizmo
- **GIVEN** a selected fixture at X = 0 m
- **WHEN** the operator drags it with the gizmo to X = 2 m
- **THEN** the position tool shows X = 2, and the fixture stays at X = 2 after save and reload

#### Scenario: Type a rotation
- **WHEN** the operator types 90 in the position tool's rotation Z field
- **THEN** the fixture rotates to 90 degrees around Z in the 3D view
