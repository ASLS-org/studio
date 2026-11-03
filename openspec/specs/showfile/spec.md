# showfile Specification

## Purpose

Defines how the show tells the operator whether it holds changes that are not yet saved, so they
know when saving or exporting is needed before closing or switching shows.

## Requirements

### Requirement: Unsaved marker follows edits
The system SHALL show a `*` before the project name in the toolbar when the show's saved content
differs from its last saved or loaded version, and SHALL remove it once the show is saved again.

#### Scenario: Edit then save
- **GIVEN** a show that was just loaded, so the toolbar shows no `*`
- **WHEN** the operator renames a cue and releases the mouse or leaves the input
- **THEN** the toolbar shows `*` before the project name
- **WHEN** the operator saves the show (Ctrl+S)
- **THEN** the `*` disappears

#### Scenario: Revert an edit by hand
- **GIVEN** a saved show where the operator changed a scene's Dimmer from 0 to 255, so `*` shows
- **WHEN** the operator sets that Dimmer back to 0
- **THEN** the `*` disappears

### Requirement: Playback does not mark the show unsaved
The system SHALL NOT show the unsaved marker because cues, effects or chases play, start or stop,
for any playback duration.

#### Scenario: Play a saved show
- **GIVEN** a show that was just saved, so the toolbar shows no `*`
- **WHEN** the operator starts and stops scenes, effects and chases for 60 s at 120 BPM without
  editing anything
- **THEN** the toolbar still shows no `*`
