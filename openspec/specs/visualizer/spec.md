# visualizer Specification

## Purpose

Defines what the 3D visualizer shows and how operators select and place fixtures in it, so the view
always matches what the hardware receives and fixture placement stays reliable.

## Requirements

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

### Requirement: Beams light the stage as projectors
The system SHALL light the floor and set pieces with each fixture's beam, shaped by its field angle
and coloured and scaled by its colour and intensity (Dimmer 0-255), with every patched beam lit at
once. A beam at intensity 0 SHALL cast no light. The in-air beam cones stay as they are drawn today.

#### Scenario: Pan moves the light on the floor
- **GIVEN** a moving head aimed at the floor with its dimmer at 255
- **WHEN** the operator drags its Pan fader
- **THEN** the spot of light on the floor follows the beam in the 3D view

#### Scenario: Zoom widens the footprint
- **WHEN** a fixture's zoom goes from its narrowest to its widest field angle
- **THEN** its footprint on the floor grows to match the beam cone

#### Scenario: Forty beams at once
- **GIVEN** 40 patched moving heads, all with the dimmer at 255
- **WHEN** they are aimed at the floor and the walls
- **THEN** every one of them lights the surface it hits

### Requirement: Gobos show on lit surfaces
The system SHALL project the selected gobo of each fixture's gobo wheel into its light on surfaces,
at every quality level that lights surfaces. Wheel slots SHALL map to a built-in set of gobo
patterns by slot number; an open slot gives a plain round spot. Gobo rotation SHALL turn the
pattern, and focus or frost SHALL blur it.

#### Scenario: Select a gobo
- **WHEN** the operator sets a fixture's Gobo Wheel channel to its third slot
- **THEN** the light on the floor shows the third built-in pattern instead of a plain spot

#### Scenario: Rotating gobo
- **WHEN** a fixture with gobo rotation runs a rotation value
- **THEN** the projected pattern turns on the floor at a matching speed

#### Scenario: Frost
- **WHEN** a fixture's frost goes from 0 to 255
- **THEN** the projected pattern goes from sharp to blurred

### Requirement: Quality levels
The system SHALL offer four quality levels: Guides (unlit stage with beam guides), Low (light on the
floor only), Medium (light on every surface at reduced resolution) and High (light on every
surface at full resolution). Changing the level SHALL take effect without reloading the show.

#### Scenario: Switch level during playback
- **GIVEN** a show playing
- **WHEN** the operator changes the quality from High to Low
- **THEN** the floor footprints stay lit, the walls and set pieces are no longer lit, and playback
  continues without a pause

#### Scenario: Guides level
- **WHEN** the quality is Guides
- **THEN** the stage shows no beam light and every beam shows its guide

### Requirement: Adaptive quality
With the quality setting on Auto, the system SHALL choose the starting level from the device's
graphics capabilities, and SHALL lower the resolution, then the level, when frames take longer than
the refresh interval for a sustained period, and raise them again after a sustained period of spare
time, without switching back and forth.

#### Scenario: Software renderer
- **GIVEN** a browser that renders WebGL in software
- **WHEN** the visualizer starts with quality on Auto
- **THEN** it starts at the Guides or Low level

#### Scenario: Heavy rig on a weak machine
- **GIVEN** quality on Auto and a rig whose frames no longer fit the refresh interval
- **WHEN** this lasts for several seconds
- **THEN** the visualizer lowers its resolution or level until frames fit again

#### Scenario: No flicker between levels
- **GIVEN** quality on Auto and a frame time close to the refresh interval
- **WHEN** the visualizer runs for a minute
- **THEN** it does not switch level more than once in either direction

### Requirement: Quality setting is per device
The system SHALL provide a Quality setting (Auto, Guides, Low, Medium, High) and a resolution scale
in the visualizer settings, SHALL keep them on the device across reloads, and SHALL NOT store them
in the showfile or mark the show unsaved when they change. When the device cannot store them, the
setting SHALL fall back to Auto.

#### Scenario: Setting survives reload
- **WHEN** the operator sets quality to Low and reloads the app
- **THEN** quality is still Low

#### Scenario: Not part of the show
- **GIVEN** a saved show with no unsaved changes
- **WHEN** the operator changes the quality
- **THEN** the toolbar shows no unsaved marker, and opening the same showfile on another machine
  uses that machine's own quality setting

#### Scenario: Storage blocked
- **GIVEN** a browser that blocks site storage
- **WHEN** the visualizer starts
- **THEN** quality is Auto and the visualizer works normally

### Requirement: Beam guides
The system SHALL draw for each beam a guide showing its centre line from the lens to where it meets
the floor or the end of the beam, its cone edges and its footprint outline on the floor, in the
beam's colour. Guides SHALL stay sharp at any resolution scale. A Beam guides setting (Auto, On,
Off) SHALL control them; Auto shows them only at the Guides level.

#### Scenario: Guides on at High quality
- **GIVEN** quality on High
- **WHEN** the operator sets Beam guides to On
- **THEN** every beam shows its guide over the lit stage

#### Scenario: Dimmer closed
- **GIVEN** Beam guides shown
- **WHEN** a fixture's dimmer is at 0
- **THEN** its guide still shows, faintly, so its position can be set

#### Scenario: Low resolution
- **GIVEN** a resolution scale of 0.5
- **WHEN** guides are shown
- **THEN** the guide lines are as sharp as at a scale of 1

### Requirement: Render on demand
The system SHALL stop drawing new frames while nothing in the view changes (no DMX value change, no
camera move, no running visual animation such as strobe or gobo rotation), and SHALL resume within
one frame when something changes.

#### Scenario: Idle show
- **GIVEN** the show stopped, the camera still and no strobe or rotating gobo active
- **WHEN** a few seconds pass
- **THEN** the visualizer draws no new frames

#### Scenario: Wake on change
- **GIVEN** the visualizer is idle
- **WHEN** the operator drags a fixture's Dimmer fader
- **THEN** the beam's intensity follows in the 3D view as the fader moves
