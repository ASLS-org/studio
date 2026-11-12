# grouping Specification

## Purpose
Defines how a group's cues are triggered from its cue pool: the trigger styles a cue can use and
what pressing and releasing it does.

## Requirements

### Requirement: Cue trigger style
A cue SHALL follow its **Trigger Style** when it is played from the group's cue pool. With
**Toggle** (the default), a click SHALL start the cue, and the next click SHALL stop it. With
**Temporary**, pressing the mouse button on the cue SHALL start it, and releasing the button SHALL
stop it, including a release outside the cue or a press interrupted by a drag. A cue started by a
chase SHALL play as the chase says, whatever its trigger style.

#### Scenario: Flash
- **GIVEN** a scene cue with **Trigger Style** **Temporary**
- **WHEN** the operator holds the mouse button on it for 2 s, then releases it
- **THEN** the scene plays for those 2 s and stops on release

#### Scenario: Release outside
- **GIVEN** a **Temporary** cue held down
- **WHEN** the pointer leaves the cue and the button is released elsewhere
- **THEN** the cue stops

#### Scenario: Toggle unchanged
- **GIVEN** a cue with **Trigger Style** **Toggle**
- **WHEN** the operator clicks it, then clicks it again
- **THEN** the cue starts on the first click and stops on the second
