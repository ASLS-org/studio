# master Specification

## Purpose
The masters on the group pool: a dimmer knob, Isolate and Blackout per group, and the grand
master with its Blackout (DBO) on the master column. They scale the levels that are sent (dimmers,
else colour), without changing what cues and the programmer hold.

## Requirements

### Requirement: A group's dimmer knob scales its playback

A group's dimmer knob (DMX 0–255, full by default) SHALL scale the Intensity that the group's cues
and chases send, by knob ÷ 255: on every fixture where the group's cue shows, and while it fades
over or into another cue. It SHALL NOT scale another group's cues on the same fixtures, the
programmer, or parked channels.

#### Scenario: Half a group

- **GIVEN** a scene setting a fixture's Dimmer to 200, playing in group A
- **WHEN** the operator turns group A's knob to 128
- **THEN** the Dimmer sent is 100, and 200 again when the knob is back at 255

#### Scenario: Another group on the same fixture

- **GIVEN** a fixture in groups A and B, its Intensity shown by a cue of group B, group A's knob
  at 0
- **THEN** the fixture's Dimmer is sent as group B's cue sets it

#### Scenario: The programmer is not a group's

- **GIVEN** a fixture's Dimmer at 180 in the programmer, the knob of every group holding it at 0
- **THEN** the Dimmer sent is 180

### Requirement: Masters scale levels only

Every master SHALL scale level channels only (a dimmer, a brightness): shutter and strobe channels,
also in the Intensity family, SHALL be sent as they are. A fine level channel SHALL be scaled with
its coarse channel as one 16-bit value.

#### Scenario: A shutter is not a level

- **GIVEN** a scene setting a fixture's shutter to Open (20) and its Dimmer to 255, its group's
  knob at 128
- **THEN** the shutter is sent at 20 and the Dimmer at 128

### Requirement: Group Blackout

A group's **Blackout** SHALL send its playback Intensity at 0 at once, whatever its knob, while it
is on; turned off, the group SHALL come back at once at its knob's level. The knob SHALL keep its
position.

#### Scenario: Cutting a group

- **GIVEN** group A playing a scene at 255 with its knob at 255
- **WHEN** the operator turns group A's Blackout on, then off
- **THEN** its fixtures' Dimmers are sent at 0 on the next tick, then at 255 on the next tick

### Requirement: Isolate

While one or more groups are isolated, only the isolated groups' playback Intensity SHALL be sent;
every other group's playback Intensity SHALL be sent at 0. The programmer and parked channels SHALL
still be sent. Turning the last Isolate off SHALL bring every group back at once.

#### Scenario: One group alone

- **GIVEN** groups A and B playing on different fixtures
- **WHEN** the operator isolates group A
- **THEN** group B's fixtures are sent dark, group A's unchanged

#### Scenario: Two groups isolated

- **GIVEN** groups A, B and C playing on different fixtures, A and B isolated
- **THEN** A and B are sent as they play, C dark

### Requirement: The grand master scales everything sent

The master column's knob (the grand master, DMX 0–255, full by default) SHALL scale every Intensity
value sent, by knob ÷ 255, after the group knobs: the groups' playback and the programmer. Parked
channels SHALL ignore it.

#### Scenario: Grand master at half

- **GIVEN** a group's scene sending a Dimmer at 200 with its group knob at 255
- **WHEN** the operator turns the grand master to 128
- **THEN** the Dimmer sent is 100

#### Scenario: Grand master and a group knob

- **GIVEN** a scene setting a Dimmer to 255, its group knob at 128, the grand master at 128
- **THEN** the Dimmer sent is 64

### Requirement: DBO

The master column's **Blackout** (DBO) SHALL send every Intensity value at 0 at once while it is
on, the programmer included, without moving the grand master; turned off, the output SHALL come
back at once at the grand master's level. Parked channels SHALL ignore it. The master column SHALL
show no **Isolate**.

#### Scenario: A hazer through DBO

- **GIVEN** a hazer's output channel parked at 76 and a group playing at full
- **WHEN** the operator turns DBO on
- **THEN** every Dimmer is sent at 0 and the hazer at 76

### Requirement: Fixtures without a dimmer

On a fixture with no level channel (an RGB PAR), the masters SHALL scale its additive colour
channels (red, green, blue, white, amber, UV, lime…) the same way; subtractive (cyan, magenta,
yellow) and colour temperature channels SHALL be sent as they are. The group level that applies is
that of the group whose cue shows the colour.

#### Scenario: An RGB PAR

- **GIVEN** an RGB PAR without a dimmer showing red 255 from a group's Colour scene
- **WHEN** the operator turns that group's knob to 128
- **THEN** red is sent at 128

### Requirement: Activity dots

Each group's five activity dots SHALL light from the bottom: in its colour up to the highest level
its playback sends after the masters, and in a faint tint of it up to the highest level its cues
ask for (any level lights the first dot). The master column's dots SHALL do the same for the whole
rig. Hovering a dot SHALL read "Output <percent>%". The dots SHALL follow playback, and the masters
at once even while the show is paused.

#### Scenario: A dimmed group

- **GIVEN** group A's scene sending its dimmers at 255: five bright dots
- **WHEN** the operator turns group A's knob to 40
- **THEN** one dot is bright and four are faint, and it reads "Output 16%"

#### Scenario: An idle group

- **GIVEN** group B with nothing playing
- **THEN** none of its dots is lit

### Requirement: A held-back column says why

While a column's output is held back by something other than its knob (its Blackout, another
group isolated, DBO), its knob's arc SHALL turn grey and hovering the knob SHALL say why
("Held back by its Blackout", "Held back: another group is isolated", "Held back by DBO").

#### Scenario: Another group isolated

- **GIVEN** group A playing, group B isolated
- **THEN** group A's knob is grey, its dots faint, and its tooltip reads "Held back: another group
  is isolated"

### Requirement: Double-click puts a knob back to full

A double-click on a group's knob or the grand master SHALL set it to full (255).

#### Scenario: Back to full

- **GIVEN** group A's knob at 40
- **WHEN** the operator double-clicks it
- **THEN** it is at full and group A's dots are bright again

### Requirement: Masters are not saved

The group knobs, Isolate, Blackout, the grand master and DBO SHALL NOT be saved with the show and
SHALL NOT mark it unsaved. A show SHALL open with every knob at full and Isolate, Blackout and DBO
off, including an older showfile that saved them.

#### Scenario: Moving a knob during a show

- **GIVEN** a saved show
- **WHEN** the operator turns a group's knob and turns DBO on and off
- **THEN** the show stays saved (no `*`)

#### Scenario: Opening a show

- **GIVEN** an older showfile that saved a group with its knob at 0 and Blackout on
- **WHEN** it opens
- **THEN** that group plays at full
