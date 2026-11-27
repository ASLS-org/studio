## ADDED Requirements

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
