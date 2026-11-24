## MODIFIED Requirements

### Requirement: Scenes end once faded in

A started scene SHALL fade in over its Fade In time, from 0 in Absolute or from what is underneath
it in Relative (the live value the channel would have without it, else its default), then SHALL
end by itself: it shows stopped and its look stays (see playback, Ended scenes keep their look).
Stopping it before it ends SHALL show it stopped at once and SHALL crossfade its channels over its
Fade Out time into what is underneath, else into their defaults. Starting it again during its
fade-out SHALL fade in from where the fade-out got to.

#### Scenario: End

- **WHEN** a scene with a 2-bar Fade In is started and 2 bars pass
- **THEN** its channels hold the scene's values and its tile shows it stopped

#### Scenario: Fade out, Absolute

- **WHEN** the only cue on a fixture, an Absolute scene with a 1-bar Fade Out, is stopped during
  its Fade In
- **THEN** its tile shows it stopped at once, and after 1 bar its Dimmer is 0

#### Scenario: Fade out, Relative

- **WHEN** a Relative scene started over another scene that still holds its look, with a 1-bar
  Fade Out, is stopped during its Fade In
- **THEN** after 1 bar its channels are back at the other scene's values
