## MODIFIED Requirements

### Requirement: Families rest

A family no cue holds on a fixture SHALL rest. Intensity SHALL go back to its default (0, or a GDTF
fixture's home value); values set by hand never become the rest. Colour, Position and Beam SHALL
keep the values on stage when the last cue holding them stops, whatever they were at that moment
(an effect's last frame, the mix a scene's Fade In had reached), until another cue takes them.

#### Scenario: Last effects stopped

- **WHEN** the only cues on a fixture, an Intensity effect and a Position effect, are stopped
- **THEN** its Dimmer goes to 0 and its pan and tilt stay where they were

#### Scenario: Stopped while fading in

- **WHEN** a Colour scene with no Fade Out is turned off halfway through its Fade In, nothing else
  holding Colour
- **THEN** the fixtures keep the colour reached at that moment, and NOW reads "kept:" and the scene

#### Scenario: A hand-set level is not the rest

- **GIVEN** a Dimmer set to 128 by hand, then cleared, nothing playing
- **WHEN** an Intensity scene at 255 plays, then stops
- **THEN** the Dimmer goes back to 0, not 128

## ADDED Requirements

### Requirement: The programmer holds what is set by hand

Values set in the universe view (channel faders and values, channel presets, the colour picker,
pan/tilt) SHALL go into the programmer, which SHALL win over every cue on those channels, in every
group, whatever plays, pauses or stops, until it is cleared. Channels it doesn't hold SHALL follow
playback. The programmer SHALL NOT be saved with the show, SHALL NOT mark the show unsaved, and
SHALL be empty after a show is opened.

#### Scenario: Taking a light during a cue

- **GIVEN** an Intensity scene at 255 playing on a fixture
- **WHEN** the operator sets its Dimmer fader to 60
- **THEN** the output carries 60, and keeps 60 on the next ticks while the scene plays

#### Scenario: Other channels keep playing

- **GIVEN** a Colour effect playing on a fixture whose Dimmer is in the programmer
- **THEN** its colour channels keep following the effect

### Requirement: Clear empties the programmer

**Clear** SHALL empty the programmer at once: Preferences → **Clear programmer** and Ctrl+Shift+C
for every fixture, the channels widget header's **Clear programmer** for the selected fixtures,
and a channel menu's **Clear** for that channel on the selected fixtures. Each cleared channel
SHALL show at once what playback gives it: the cue holding its family, else its rest.

#### Scenario: Clear during a cue

- **GIVEN** a Dimmer held at 60 in the programmer while an Intensity scene at 255 plays
- **WHEN** the operator presses Ctrl+Shift+C
- **THEN** the output carries 255 on the next tick

#### Scenario: Clear the selected fixtures

- **GIVEN** two fixtures in the programmer, one of them selected
- **WHEN** the operator presses **Clear programmer** in the channels widget's header
- **THEN** the selected fixture follows playback again, the other keeps its programmer values

#### Scenario: Clear one channel

- **GIVEN** a selected fixture with its Dimmer and Red in the programmer
- **WHEN** the operator picks **Clear** in the Dimmer's menu
- **THEN** the Dimmer follows playback again and Red stays in the programmer

### Requirement: Park locks a channel

A parked channel SHALL output its parked value whatever plays, above the programmer, the grand
master and blackout, until **Unpark**. **Clear** SHALL NOT unpark it. Parked channels SHALL be saved with the show (per fixture, channel and value) and
parked again when it opens; Park and Unpark SHALL mark the show unsaved. Older showfiles have no
parked channels.

#### Scenario: Hazer through a cue

- **GIVEN** a hazer channel parked at 76
- **WHEN** an Intensity scene setting it to 255 plays, then the operator presses Clear
- **THEN** the output keeps 76

#### Scenario: Saved

- **GIVEN** a parked channel, the show saved
- **WHEN** Studio reloads
- **THEN** the channel is parked at the same value

### Requirement: A channel shows where its value comes from

In the channels widget, each channel's menu box and fader fill SHALL show what drives it: violet
for the programmer, red for parked (fader and value locked), blue for playback (a cue, or the
value a cue left); at rest, the default look. Hovering the box or fader SHALL name the source
("Programmer", "Parked at 76", "Colour cue: Red", "Kept from: Red", "Rest"). Faders and values
SHALL show the value sent.

#### Scenario: A cue's value

- **GIVEN** a Colour scene named Red holding a fixture's colour
- **WHEN** the operator hovers its Red fader
- **THEN** the fader is blue and its tooltip reads "Colour cue: Red"

#### Scenario: A programmer value

- **WHEN** the operator moves a fixture's Dimmer fader
- **THEN** the fader and the Dimmer's menu box turn violet and the tooltip reads "Programmer"

#### Scenario: At rest

- **GIVEN** nothing playing and nothing held on a fixture
- **THEN** its faders and menu boxes keep the default look and the tooltips read "Rest"

### Requirement: The channels widget header acts on the selection

In the universe view, the channels widget's header SHALL hold, right after its title,
**Clear programmer** (clears the selected fixtures) and **Unpark** (frees every parked channel of
the selected fixtures). Each SHALL be disabled while the selection has nothing for it to act on.

#### Scenario: Nothing held

- **GIVEN** selected fixtures with no programmer values and no parked channels
- **THEN** **Clear programmer** and **Unpark** are disabled

#### Scenario: Unpark the selection

- **GIVEN** two selected fixtures, each with a parked channel
- **WHEN** the operator presses **Unpark** in the header
- **THEN** both channels follow the programmer or playback again and **Unpark** is disabled

### Requirement: Held fixtures are marked

Fixtures with programmer values SHALL read "· prog", and fixtures with parked channels "· parked",
after their address in the fixture pool rows. Patch bay rows SHALL show the address only.

#### Scenario: Holding two fixtures

- **WHEN** the operator sets the Dimmer of two selected fixtures
- **THEN** both fixture pool rows read "· prog" and their patch bay rows show their address only
