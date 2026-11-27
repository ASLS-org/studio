## ADDED Requirements

### Requirement: Scene fade times

A scene SHALL have a Fade In and a Fade Out, each with its own time in bars (0 to 64), set in its
fade widgets. A time of 0 SHALL apply the change at once. Cue Settings SHALL NOT show a Duration
or a Loop Style for a scene. A scene from a showfile without fade times SHALL take its saved
Duration as its Fade In time and 0 as its Fade Out time.

#### Scenario: Scene settings

- **WHEN** a scene is selected
- **THEN** Cue Settings shows no Duration and no Loop Style, and the Fade In and Fade Out widgets
  each have a Bars field

#### Scenario: Older scene

- **WHEN** a showfile saved before this change, with a scene of Duration 4, is loaded
- **THEN** that scene's Fade In time is 4 bars and its Fade Out time is 0

### Requirement: Scenes end once faded in

A started scene SHALL fade in over its Fade In time, from 0 in Absolute or from the channels'
values in Relative, then SHALL end by itself: it shows stopped and its values stay on the
fixtures. Stopping it before it ends SHALL show it stopped at once and SHALL fade its channels over
its Fade Out time: to 0 in Absolute, back to the values it started from in Relative. Starting it
again during its fade-out SHALL fade in from where the fade-out got to.

#### Scenario: End

- **WHEN** a scene with a 2-bar Fade In is started and 2 bars pass
- **THEN** its channels hold the scene's values and its tile shows it stopped

#### Scenario: Fade out, Absolute

- **WHEN** an Absolute scene with a 1-bar Fade Out is stopped during its Fade In
- **THEN** its tile shows it stopped at once, and after 1 bar its channels are at 0

#### Scenario: Fade out, Relative

- **WHEN** a Relative scene started over another scene, with a 1-bar Fade Out, is stopped during
  its Fade In
- **THEN** after 1 bar its channels are back at the other scene's values
