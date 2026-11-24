## ADDED Requirements

### Requirement: Cue priority and intensity mode

Each cue SHALL have a priority (Low, Normal, High or Top) and an intensity mode (HTP or LTP), set
in Cue Settings and saved with the show. A new cue, and a cue from a showfile without them, SHALL
be Normal and HTP. A chase item SHALL play with its cue's priority and intensity mode.

#### Scenario: Older show

- **WHEN** a showfile saved before this change is loaded
- **THEN** every cue is Normal and HTP, and the show is not marked unsaved

### Requirement: Higher priority wins a channel

When cues drive the same channel, the channel SHALL take the value of the cue with the highest
priority, whatever their start order.

#### Scenario: High effect over a Normal scene

- **WHEN** a High effect on Pan is playing and a Normal scene setting Pan is started after it
- **THEN** Pan keeps following the effect

### Requirement: Last started wins at equal priority

At equal priority, a channel SHALL take the value of the cue started most recently, except a
Dimmer channel between HTP cues. A cue starts when it is triggered, or when the chase playhead
enters its item. The order Live runs cues in SHALL NOT matter.

#### Scenario: Chase item started after a cue

- **WHEN** a scene setting Pan is started, then a chase already playing enters an item whose cue
  sets Pan, at the same priority
- **THEN** Pan takes that cue's value

#### Scenario: LTP effect on a dimmer

- **WHEN** a Normal LTP dimmer effect is started after a Normal scene holding the Dimmer at 255
- **THEN** the Dimmer follows the effect

### Requirement: Highest value wins on HTP dimmers

At equal priority, a Dimmer channel driven by several HTP cues SHALL take the highest of their
values.

#### Scenario: Two scenes on one dimmer

- **WHEN** two Normal HTP scenes set a fixture's Dimmer to 100 and 200 and both play
- **THEN** the Dimmer is 200, whichever started last

### Requirement: Fades blend with what is underneath

A fading cue SHALL blend its value with the value the channel would have without it: the next
cue's live value under the rules above, else the channel's default. A Relative cue SHALL fade in
from that value and back to it; an Absolute scene SHALL fade in from 0. Stopping a cue with a
Fade Out SHALL crossfade each of its channels into that value over its Fade Out; with a Fade Out
of 0, or for an Absolute effect, at once.

#### Scenario: Stopping over a moving effect

- **WHEN** a Normal scene setting Pan, started after a Normal Pan effect, is stopped with a 1-bar
  Fade Out
- **THEN** Pan moves from the scene's value into the effect's moving value over 1 bar, with no
  jump

#### Scenario: Fade in over an effect

- **WHEN** a Relative scene setting Pan, with a 1-bar Fade In, is started over a Pan effect
- **THEN** Pan blends from the effect's moving value to the scene's over 1 bar

### Requirement: Defaults when nothing drives a channel

A channel that no cue drives any more SHALL go to its default: the profile's home value when it
has one, else 128 for Pan and Tilt, else 0. It SHALL get there over the Fade Out of the cue that
released it, or at once.

#### Scenario: Last cue stopped

- **WHEN** the only cue on a fixture, an Absolute scene with a 1-bar Fade Out, is stopped
- **THEN** over 1 bar its Dimmer goes to 0 and its Pan and Tilt to 128

### Requirement: Ended scenes keep their look

A scene that ends by itself SHALL keep its claim on the channels it held. A cue with a higher
priority, or one started later at the same priority, SHALL take those channels; a cue started
earlier at the same or a lower priority SHALL NOT, Dimmer included.

#### Scenario: Effect started before an ended scene

- **WHEN** a Normal effect on Pan is playing, a Normal scene setting Pan is started after it and
  ends
- **THEN** Pan keeps the scene's value while the effect keeps playing

### Requirement: Stopping a cue releases its channels

A cue stopped by the operator, deleted, or whose chase is stopped SHALL release its claims once
its fade-out is done. Each released channel SHALL then follow the next cue under the rules above,
else its default.

#### Scenario: Higher cue stopped

- **WHEN** a High effect on Pan, with no Fade Out, is stopped while a Normal effect on Pan plays
- **THEN** Pan follows the Normal effect from the next tick

### Requirement: Release held looks

The master column SHALL have a **Release** button in place of its Isolate button. It SHALL release
every held look: their channels follow what still plays, else go to their defaults, at once.

#### Scenario: Releasing an ended scene

- **WHEN** an ended scene holds Pan, an effect started before it plays on Pan, and Release is
  pressed
- **THEN** Pan follows the effect from the next tick
