## ADDED Requirements

### Requirement: Chase items take families

When the playhead enters an item, its cue SHALL take its families in the chase's group as if it had
been started there and then, in its own Mode (see playback). An item that
ends with its cue faded out SHALL hand its families back; one that ends without a Fade Out SHALL
keep them until another cue takes them, the chase stops or its cue's row's stop button is clicked.
An item a
Replace cue turns off SHALL stay off until the playhead enters another item of its cue.

#### Scenario: Steps replace each other

- **WHEN** a chase plays a red then a blue Replace Colour scene, back to back
- **THEN** the fixtures turn blue as the second item starts and only the blue row shows playing

#### Scenario: Overlapping steps

- **WHEN** a red Replace Colour scene's item spans bars 1 and 2, and a blue one's starts at bar 2
- **THEN** the fixtures turn blue at bar 2 and stay blue: red doesn't come back before its next item

#### Scenario: Stopping the chase

- **WHEN** a chase whose current Layer item holds Colour over a playing colour effect is stopped
- **THEN** Colour goes back to the effect

### Requirement: The timeline groups lanes by family

The chase timeline SHALL group its lanes under the cue pool's family heads, in the same order
(Intensity, Colour, Position, Beam), each lane head showing its cue as the cue pool's row
does (picture, type, name, value line). A click on a family's
head SHALL fold or unfold its lanes. **Fold Cues** SHALL also hide the families with no items.

#### Scenario: Demo chase

- **WHEN** a chase of the demo group is opened
- **THEN** each cue's lane sits under its family's head: Cue 6 and Cue 8's under Colour

#### Scenario: Folding a family

- **WHEN** the Colour head is clicked
- **THEN** the Colour lanes hide and the head stays, with who holds Colour; a second click shows
  them again

### Requirement: Chase items show their cue

An item SHALL show its cue's picture and name over its fade preview, tinted with its family's
colour (Intensity gold, Colour pink, Position blue, Beam green), as its curve, its family's head,
the bars saying who holds the family and an edge of its lane's head are, so families read apart.

#### Scenario: A colour item

- **WHEN** a red Colour scene has an item in a chase
- **THEN** the item shows red and "Red" over its fade curve, tinted pink as the Colour head, while
  an Intensity effect's item is tinted gold

### Requirement: The timeline shows who holds each family

Each family head of the timeline SHALL draw, along the time, the cue holding that family at each
moment, with its picture and name, by the playback rules (Mode, start order), from the chase's items
alone. An item's stretch where other items hold all of its families SHALL be striped; the stretch
after a Replace item turns it off SHALL be dimmed. Resting the pointer on an item SHALL say its
Mode, and what covers or turns it off, from when.

#### Scenario: A Layer item over a scene

- **WHEN** a Colour scene's item spans bars 1 to 4 and a Layer colour effect's item spans bar 2
- **THEN** the Colour head draws the scene, then the effect over bar 2, then the scene again, and the
  scene's item is striped over bar 2

#### Scenario: A Replace item

- **WHEN** a red Replace Colour scene's item spans bars 1 and 2, and a blue one's starts at bar 2
- **THEN** the red item is dimmed from bar 2, and the Colour head draws red then blue

## MODIFIED Requirements

### Requirement: Chase items start and end their cues

When the chase's playhead enters an item, the item's cue SHALL start with its own Fade In, from
the item's start. The cue's Fade Out SHALL end at the item's end. The item's length SHALL set how
long the cue plays, never its fade times. When an item is shorter than its cue's Fade In and Fade
Out together, both SHALL shrink in proportion to fit it.

#### Scenario: Stretching an item

- **WHEN** an item holding a scene with a 1-bar Fade In is stretched from 2 to 8 bars
- **THEN** the scene still reaches its values 1 bar after the item starts, and holds them longer

#### Scenario: Effect in a chase

- **WHEN** a chase plays an item holding a Layer effect with a 1-bar Fade In and Fade Out
- **THEN** the effect fades in over the item's first bar and fades out over its last bar

#### Scenario: A One Shot chase ends

- **WHEN** a One Shot chase reaches its end while an item's cue is fading out
- **THEN** that cue reaches the end of its Fade Out before the chase stops

#### Scenario: Short item

- **WHEN** an item 1 bar long holds a scene with a 1-bar Fade In and a 1-bar Fade Out
- **THEN** the scene fades in over the first half bar and out over the second

### Requirement: Cues fade in chases as they do on their own

In a chase, every cue SHALL fade, scenes and effects in either Mode. A cue SHALL fade in from what the
fixtures show when its item begins (the live value of the cue it covers, else the channel's
value), and its Fade Out SHALL blend back into what it hands its families to, else let them rest.

#### Scenario: Absolute effect

- **WHEN** a chase plays an item holding a Replace (formerly Absolute) effect with a 1-bar Fade In
- **THEN** the effect fades in over the item's first bar

### Requirement: Chase item fade preview

A chase item SHALL draw its cue's Fade In curve over the Fade In time from the item's start, a flat
line while the cue holds, and its Fade Out curve over the Fade Out time up to the item's end,
shrunk as playback shrinks them. An item whose cue's fade times are 0 SHALL draw a flat line over
the whole item.

#### Scenario: Preview follows the fade times

- **WHEN** an item 4 bars long holds a scene with a 1-bar Fade In and a 2-bar Fade Out
- **THEN** the item draws the Fade In curve over its first bar, a flat line over the second, and
  the Fade Out curve over its last 2 bars
