# chases Specification

## Purpose
Defines how chases play: when a chase that is started actually begins, and which of its settings
the show keeps.

## Requirements

### Requirement: Quantize
A chase SHALL begin on the next boundary of its **Quantize** value at the show's BPM, in 4/4:
**1/8** every half beat, **1/4** every beat, **1/2** every 2 beats, **1/1** every bar (4 beats).
With **None** it SHALL begin at once. Boundaries SHALL be counted from the start of the show
clock.

#### Scenario: Quarter
- **GIVEN** a chase on **1/4** at 120 BPM (one beat = 500 ms)
- **WHEN** it is started 1.2 s after the clock started
- **THEN** it begins at 1.5 s

#### Scenario: Bar
- **GIVEN** a chase on **1/1** at 120 BPM (one bar = 2 s)
- **WHEN** it is started 1.2 s after the clock started
- **THEN** it begins at 2 s, on the next bar

### Requirement: Quantize is saved
A chase's **Quantize** SHALL be saved with the show. A chase saved without one SHALL load on
**1/1**.

#### Scenario: Reload
- **GIVEN** a chase set to **1/4**
- **WHEN** the show is saved and opened again
- **THEN** the chase is still on **1/4**

#### Scenario: Older show
- **GIVEN** a show saved before this change
- **WHEN** it is opened
- **THEN** its chases are on **1/1** and the show is not marked unsaved

### Requirement: Chase items start and end their cues

When the chase's playhead enters an item, the item's cue SHALL start with its own Fade In, from
the item's start. The cue's Fade Out SHALL end at the item's end. The item's length SHALL set how
long the cue plays, never its fade times. When an item is shorter than its cue's Fade In and Fade
Out together, both SHALL shrink in proportion to fit it.

#### Scenario: Stretching an item

- **WHEN** an item holding a scene with a 1-bar Fade In is stretched from 2 to 8 bars
- **THEN** the scene still reaches its values 1 bar after the item starts, and holds them longer

#### Scenario: Effect in a chase

- **WHEN** a chase plays an item holding a Relative effect with a 1-bar Fade In and Fade Out
- **THEN** the effect fades in over the item's first bar and fades out over its last bar

#### Scenario: A One Shot chase ends

- **WHEN** a One Shot chase reaches its end while an item's cue is fading out
- **THEN** that cue reaches the end of its Fade Out before the chase stops

#### Scenario: Short item

- **WHEN** an item 1 bar long holds a scene with a 1-bar Fade In and a 1-bar Fade Out
- **THEN** the scene fades in over the first half bar and out over the second

### Requirement: Cues fade in chases as they do on their own

In a chase, an effect SHALL fade only when its Start is Relative. A Relative cue SHALL fade from,
and back to, the values its channels held when its item began. An Absolute scene SHALL fade from
and to 0.

#### Scenario: Absolute effect

- **WHEN** a chase plays an item holding an Absolute effect with a 1-bar Fade In
- **THEN** the effect plays at full strength from the item's start

### Requirement: Chase item fade preview

A chase item SHALL draw its cue's Fade In curve over the Fade In time from the item's start, a flat
line while the cue holds, and its Fade Out curve over the Fade Out time up to the item's end,
shrunk as playback shrinks them. An item whose cue does not fade (an Absolute effect, or times of
0) SHALL draw a flat line over the whole item.

#### Scenario: Preview follows the fade times

- **WHEN** an item 4 bars long holds a scene with a 1-bar Fade In and a 2-bar Fade Out
- **THEN** the item draws the Fade In curve over its first bar, a flat line over the second, and
  the Fade Out curve over its last 2 bars
