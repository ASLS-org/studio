# output-wsc Specification

## Purpose

Defines when and what Studio sends to the WSC gateway for each streamed universe, so the hardware
always reflects the show's current DMX values.

## Requirements

### Requirement: Output keeps running while the show is paused or stopped
The system SHALL keep sending each streaming universe's current DMX frame (512 channels, 0-255)
while the show is playing, paused or stopped. Pausing freezes playback values; it does not stop
output.

#### Scenario: Pause during an effect
- **GIVEN** a universe streaming to a gateway while a dimmer effect plays
- **WHEN** the operator pauses the show
- **THEN** the gateway keeps receiving frames, with the dimmer values frozen where they were

#### Scenario: Edit while stopped
- **GIVEN** the show is stopped and the universe is streaming
- **WHEN** the operator sets a fixture's Dimmer fader to 255
- **THEN** the next frames sent carry 255 on that fixture's Dimmer channel

### Requirement: Each frame carries the values of its tick
The system SHALL send, for each engine tick (about 60 per second), the frame produced after every
running scene, effect and chase has updated for that tick, regardless of the order in which cues
and streams were started.

#### Scenario: Cue started after the stream
- **GIVEN** a universe that started streaming before any cue
- **WHEN** a scene setting Dimmer to 255 with no fade starts
- **THEN** the first frame sent after the scene's first tick already carries 255

### Requirement: Universe Config opens the connections
The **Config** button next to a universe's **Output** SHALL open the outputs popup
(**Input/Outputs**, the same one as **Preferences → Outputs**), where connections are created
and set up.

#### Scenario: Config
- **WHEN** the operator presses **Config** in a universe's settings
- **THEN** the **Input/Outputs** popup opens
