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

### Requirement: The cue pool shows one column per family

A group's cue pool SHALL show one column per family, side by side: **Intensity**, **Colour**,
**Position** and **Beam**. Each column SHALL head with its family's name and icon, an **add** button
and its **NOW** line, then list the cues of its family in their order as list rows: one under the
other, a border between rows, the list's hover, selection and keys. When its rows don't fit, a
column SHALL scroll them under its head.

#### Scenario: Demo group

- **WHEN** a group with Colour and Position scenes is opened
- **THEN** the Colour column lists its Colour scenes, the Position column its Position scenes, and
  every column head has an **add** button

#### Scenario: Many cues

- **WHEN** the Colour column holds more cues than the strip's height shows and its rows are
  scrolled down
- **THEN** its head, **add** and NOW stay in view

#### Scenario: Keys

- **WHEN** a row of the Colour column is selected, the column has focus and Down is pressed
- **THEN** the next row is selected, as a click on it does

### Requirement: Adding a cue to a column

A column's **add** button SHALL open **Add Cue** with a **Type** (Scene or Effect) and a **Name**.
**OK** SHALL add a cue of the column's family at the end of the column, and open it as a click on
it does. Its default name SHALL be the family's name and a number ("Colour 3").

#### Scenario: A new colour effect

- **WHEN** the Colour column's **add** is clicked, Effect is picked and OK pressed
- **THEN** a Colour effect named "Colour" and its number ends the Colour column and is selected,
  and its Add Modulated Channel lists colour channels only

### Requirement: Ordering cues in a column

Dragging a cue's row by its grip up or down its column SHALL move it there, the other rows sliding
apart where it will land, as in lists; **Escape** SHALL cancel the drag. The order SHALL be saved
with the show.

#### Scenario: Reorder

- **WHEN** the third row of the Colour column is dragged by its grip above the first
- **THEN** it is first in the column, also after saving and loading the show

### Requirement: Cues are shown by their content

A cue SHALL be told apart by what it sets, never by a colour of its own: the cue pool, **Add Cue**,
**Cue Settings** and the chase timeline SHALL NOT show or offer a cue colour. A colour saved with an
older show SHALL be kept as it is.

#### Scenario: Cue Settings

- **WHEN** a cue is selected
- **THEN** its Cue Settings have no Color field, and its row and chase items show no colour of the
  cue's own

### Requirement: Rows preview their content

A cue's row SHALL show its name, its type, a picture of what it sets and a value line saying it in
words and numbers: an intensity level in %, a colour's name or how many colours, pan and tilt in
degrees or how many aims, each beam function and its value, or what an effect moves and its
length.

#### Scenario: A colour scene

- **WHEN** a Colour scene sets every fixture red
- **THEN** its row shows red and "Red"

#### Scenario: An intensity scene

- **WHEN** an Intensity scene sets every dimmer at 75%
- **THEN** its value line reads "75%"

#### Scenario: A position scene

- **WHEN** a Position scene aims every fixture at pan 30° and tilt 45° from centre
- **THEN** its picture shows the first fixture's aim and its value line reads "Pan 30° Tilt 45°"

#### Scenario: A beam scene

- **WHEN** a Beam scene sets a fixture's zoom at 40% and its gobo wheel on Gobo 3
- **THEN** its value line reads "Zoom 40% · Gobo 3"

#### Scenario: An effect

- **WHEN** an Intensity effect moves the dimmers over 1 bar
- **THEN** its row shows its wave and "Dimmer · 1 bar"

### Requirement: Rows show edits at once

A row SHALL show an edit of its cue as soon as it is made, whatever editor made it.

#### Scenario: Picking a colour

- **WHEN** a scene's colour is changed in its colour picker
- **THEN** its row shows the new colour at once

### Requirement: Rows show playback

A playing cue's row SHALL
show it as a playing chase does in the group pool, whether the cue plays by itself or through a
chase: a fill growing across the row with its progress (a scene's fade in, then full; an effect's
pass) and its stop button blinking. It SHALL be striped while other cues hold all of its families.

#### Scenario: A scene fading in

- **WHEN** a scene with a 1-bar Fade In is played
- **THEN** its row fills across over that bar, then stays full, its stop button blinking

#### Scenario: Stopped

- **WHEN** no cue of a column plays and none is kept
- **THEN** none of its rows shows a fill or a button, until the pointer is on one: its play
  button then shows over its picture

#### Scenario: Covered

- **WHEN** a Layer effect holds every family a playing scene uses
- **THEN** the scene's row shows playing and striped

### Requirement: Pictures stay readable

An effect's waves SHALL be drawn over one cycle whatever their frequency, several waves layered,
each a little fainter than the one before. A position SHALL be drawn for the first fixture only: a
scene's aim, an effect's path filling the picture.

#### Scenario: A fast wave

- **WHEN** an Intensity effect moves Dimmer and Shutter at 8 cycles per pass
- **THEN** its picture shows one cycle of each wave, the second fainter

#### Scenario: A small circle

- **WHEN** a Position effect draws a small circle with every fixture
- **THEN** its picture shows the first fixture's circle filling the picture

### Requirement: The play button sits on the picture

A row's play button SHALL sit over the centre of its picture, shown while the pointer is on the
row, the picture dimmed under it; while the cue plays, its stop button SHALL show there whatever the
pointer.

#### Scenario: Hover and play

- **WHEN** the pointer rests on a stopped scene's row, and its play button is clicked
- **THEN** the play button shows over its dimmed picture, then a blinking stop button stays there
  while it plays, the pointer on the row or not

### Requirement: A kept cue's row keeps its fill

While the stage keeps a stopped cue's values (its column's NOW reads "kept:" it), its row's fill
SHALL stay where it was when the cue stopped, until another cue takes its family.

#### Scenario: Kept

- **WHEN** a Colour scene is turned off halfway through its Fade In, nothing else holding Colour
- **THEN** its row keeps its fill at half until another cue takes Colour

### Requirement: NOW says where each family comes from

Each column head SHALL have a **NOW** line with the stage's value on the group's fixtures (level,
colour, aim, zoom) and its source: the cue holding the family, the cue and the chase when a chase
item holds it ("Red · Verse"), "kept:" and the cue whose value Colour, Position or Beam keep, or
"rest". NOW SHALL only show: clicking it SHALL do nothing.

#### Scenario: A colour

- **WHEN** a Colour scene Red is started
- **THEN** NOW reads "Red" in the Colour column with Red's colour, and "rest" in the columns no cue
  holds

#### Scenario: Kept

- **WHEN** the only cue setting colour, Red, is turned off
- **THEN** the fixtures stay red and the Colour NOW reads "kept: Red"
