# playback Specification

## Purpose
Defines how cues share the stage while they play: channel families, one cue per family in a group,
Replace and Layer, handing families back, resting and keeping, flashes, and blind
programming.

## Requirements

### Requirement: Channel families

Every channel SHALL belong to one family, from its fixture attribute: **Intensity** (dimmer,
shutter, strobe), **Colour** (colour mixing, colour wheels, colour temperature), **Position** (pan,
tilt) or **Beam** (zoom, focus, gobos, prisms, iris, frost, blades). Other channels (speeds,
control, fog) SHALL belong to none and follow the cue started last; every cue's editor SHALL offer
them, whatever its family. A cue uses the families of the channels it sets.

#### Scenario: Families of channels

- **WHEN** a fixture has Dimmer, Pan, Tilt, Green, Zoom and Pan/Tilt Speed channels
- **THEN** they are Intensity, Position, Position, Colour, Beam and no family

#### Scenario: A speed in a position cue

- **WHEN** a Position scene is opened
- **THEN** its editor offers Pan, Tilt and Pan/Tilt Speed, and no colour channel

### Requirement: A cue's family

Each cue SHALL set one family: Intensity, Colour, Position or Beam, set by the cue pool column it is
added to and saved with the show; looks combining families are built with chases. Cue Settings
SHALL offer every family while the cue sets nothing, else only its own; changing it moves the cue to
that column.

#### Scenario: An empty cue's family

- **WHEN** a cue that sets nothing yet is selected
- **THEN** its Family field offers the four families; once it sets a channel, only its own

### Requirement: Older cues are split per family

A cue loaded without a family, or saved as a Look (several families), SHALL be split into one cue
per family it sets, in family order, each with its name, settings and only that family's channels;
the first SHALL keep its id and the channels of no family. A cue setting no family SHALL become an
Intensity cue. Each chase lane of a split cue SHALL be copied for each part, with the same items.
Loading SHALL NOT mark the show unsaved.

#### Scenario: Older show

- **WHEN** a showfile saved before this change holds a scene setting only colour channels and an
  effect moving dimmer and pan, played by a chase
- **THEN** the scene is in the Colour column, the effect is an Intensity effect and a Position effect
  of the same name, each with its lane in the chase holding the same items, and the show is not
  marked unsaved

### Requirement: One cue per family in a group

When a cue starts, it SHALL take each family it uses in its group from the cue holding it there,
on all that cue's fixtures, whatever fixtures each covers. A group's fixtures that the holder of a
family doesn't cover SHALL rest in that family.

#### Scenario: Two colours on different fixtures

- **WHEN** a Colour scene sets fixtures 1 to 8 red, then a Colour scene setting fixtures 9 to 16
  blue starts in the same group
- **THEN** fixtures 9 to 16 turn blue and fixtures 1 to 8 rest in Colour

#### Scenario: Colour and position together

- **WHEN** a Position effect moves the group, and a Colour scene starts
- **THEN** the fixtures take the scene's colour while the effect keeps moving them

### Requirement: Replace turns off what it takes over

A cue SHALL turn off by itself once each family it uses is held in its group by a **Replace** cue
started after it, when those have faded in. A cue that still holds a family
SHALL keep playing. A turned-off cue SHALL NOT come back when the Replace cues stop.

#### Scenario: Second effect over the first

- **WHEN** an effect plays, and a Replace effect using all of its families starts
- **THEN** the first effect's row shows it off, and stopping the second one doesn't bring it back

### Requirement: Layer gives back what it covers

A cue in **Layer** mode SHALL play over the cues it takes families from without turning them off.
When it stops, each family SHALL go back to the cue it covered.

#### Scenario: Pan effect over a position scene

- **WHEN** a Position scene holds pan 128, a Layer pan effect plays over it, and the effect is
  stopped
- **THEN** pan goes back to 128 and the scene's row showed it playing throughout

### Requirement: Turning a cue off hands its families back

Turning a cue off SHALL hand each family it holds to the newest cue still playing in its group
that uses it, else let it rest, blending over the turned-off cue's Fade Out (at once with none).
Deleting a playing cue and stopping a chase SHALL hand back the same way.

#### Scenario: Colour scene turned off

- **WHEN** a Layer Colour scene with a 1-bar Fade Out, playing over a colour effect, is turned off
- **THEN** over 1 bar the fixtures blend back into the effect's moving colour

### Requirement: Shared fixtures across groups

When cues of different groups hold the same family on a fixture, the fixture SHALL follow the one
started last. Each cue SHALL keep the family on its other
fixtures.

#### Scenario: A group inside another

- **WHEN** group All plays a red Colour scene, then group Left, holding half of All's fixtures,
  starts a blue Colour scene
- **THEN** Left's fixtures turn blue and the others stay red

### Requirement: Families rest

A family no cue holds on a fixture SHALL rest. Intensity SHALL go back to the level it had before
playback took it (0 unless it was set in the universe view). Colour, Position and Beam SHALL keep
the values on stage when the last cue holding them stops, whatever they were at that moment (an
effect's last frame, the mix a scene's Fade In had reached), until another cue takes them.

#### Scenario: Last effects stopped

- **WHEN** the only cues on a fixture, an Intensity effect and a Position effect, are stopped
- **THEN** its Dimmer goes to 0 and its pan and tilt stay where they were

#### Scenario: Stopped while fading in

- **WHEN** a Colour scene with no Fade Out is turned off halfway through its Fade In, nothing else
  holding Colour
- **THEN** the fixtures keep the colour reached at that moment, and NOW reads "kept:" and the scene

### Requirement: Colour and position move whole

A cue holding Colour on a fixture SHALL set all of its colour channels, those it doesn't set at 0,
so the colour shown is exactly the cue's. A cue holding Position SHALL set Pan and Tilt together;
the one it doesn't set SHALL keep its value.

#### Scenario: Green and blue over red

- **WHEN** an effect driving Green and Blue takes Colour from a scene setting Red at 255
- **THEN** Red is 0 while the effect holds Colour

### Requirement: Flashes

A Temporary cue SHALL take its families while it is held down, whatever its mode, and on release
SHALL hand them back to the cues it covered. It SHALL never turn another cue off.

#### Scenario: White flash

- **WHEN** a colour effect plays and a Temporary white Colour scene is held down over it, then released
- **THEN** the fixtures are white while it is held, then follow the effect again, whose row
  showed it playing throughout

### Requirement: New cues replace

A new cue, scene or effect, SHALL be in **Replace** mode, so it turns off the cue of its family it
takes over; **Layer** SHALL stay settable in Cue Settings. A cue SHALL keep the mode it was saved
with.

#### Scenario: New effect over a scene

- **WHEN** a Position scene plays, and a new Position effect is added and started
- **THEN** the effect takes Position and the scene turns off

### Requirement: Programming is blind

Clicking a cue's row, or selecting it with the keys, SHALL open it and SHALL NOT change the stage.
Editing a cue that isn't playing SHALL NOT change the stage; a playing cue's edits SHALL show as they
are made. Its play button SHALL play and stop it with its fades.

#### Scenario: Editing blind

- **WHEN** a scene that isn't playing is clicked and its colour changed
- **THEN** the stage doesn't change, and its row shows the new colour

#### Scenario: Playing from the row

- **WHEN** a scene's play button is clicked
- **THEN** it plays with its Fade In, its row shows it playing, and NOW names it

### Requirement: Cue Settings explain sharing

Cue Settings SHALL show, in two columns, the cue's **Family** and its **Mode** (Replace or Layer,
saved as before: Absolute is Replace, Relative is Layer), each with a hint when the pointer rests on
it. Cues SHALL
have no priority: among the cues holding a family, the one started last wins, and a priority saved
by an older show SHALL be ignored.

#### Scenario: Older cue's mode

- **WHEN** a cue saved as Relative is selected
- **THEN** its Mode shows Layer
