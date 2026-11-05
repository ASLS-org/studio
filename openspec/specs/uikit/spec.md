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
