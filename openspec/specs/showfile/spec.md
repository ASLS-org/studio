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

### Requirement: Showfiles reference GDTF fixtures
The system SHALL save patched GDTF fixtures in the showfile by their GDTF fixture type, without
embedding the fixture file, and SHALL reopen them from this device's fixture library or the
bundled fixtures. Older showfiles SHALL open unchanged.

#### Scenario: Save and reopen
- **GIVEN** a show with a patched imported GDTF fixture in a group with a scene
- **WHEN** the operator saves and reloads the show
- **THEN** the fixture, its mode, address, position, group and scene values are restored

### Requirement: Missing fixtures on open
When a showfile references GDTF fixtures that are neither in this device's library nor bundled,
the system SHALL list them before opening the show and let the operator import them or open the
show without them. A show opened without them SHALL keep their patch, group and scene data, so
saving it and opening it later with the fixtures imported restores them.

#### Scenario: Import the missing fixture
- **GIVEN** a showfile with a GDTF fixture that this device's library does not have
- **WHEN** the operator opens it and imports the matching `.gdtf` file in the Missing fixtures
  popup
- **THEN** the show opens with that fixture patched as saved

#### Scenario: Open without, then restore
- **GIVEN** the operator chose Open anyway for a missing fixture
- **WHEN** they save the show, import the fixture, and reopen the saved file
- **THEN** the fixture is back with its address, groups and scene values

#### Scenario: Address stays reserved
- **GIVEN** a show opened without a missing fixture at universe 1 address 1-16
- **WHEN** the operator patches a new fixture
- **THEN** addresses 1-16 of universe 1 are not offered as free

#### Scenario: Not marked unsaved
- **WHEN** a show is opened without its missing fixtures
- **THEN** the unsaved marker does not appear until the operator edits something

### Requirement: Effects save their cell phase option
The showfile SHALL save each effect channel's **Spread over** option. A showfile without it
SHALL open with **Fixtures**. Selecting cells in the universe or scene view SHALL NOT change
the showfile nor mark the show as unsaved.

#### Scenario: Round trip
- **GIVEN** an effect channel with **Spread over** set to **Cells**
- **WHEN** the show is saved and opened again
- **THEN** it is still set to **Cells**

#### Scenario: Cell selection
- **WHEN** the operator selects another cell in the scene view without editing a value
- **THEN** the show stays saved (no `*`)

### Requirement: Shows with dangling fixture references open
Opening a show SHALL skip each universe or group reference to a fixture that isn't in the show's
fixture list, instead of failing, and SHALL report once how many references were dropped. The
show SHALL then be saved locally without them.

#### Scenario: Group refers to a deleted fixture
- **GIVEN** a showfile whose group 0 lists fixture 7, which isn't among the show's fixtures
- **WHEN** the operator opens it
- **THEN** the show opens with group 0's other fixtures, a message says one fixture reference
  was dropped, and opening the saved show again shows no message
