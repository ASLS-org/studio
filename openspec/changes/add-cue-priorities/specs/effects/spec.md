## MODIFIED Requirements

### Requirement: Effect fade-in in Relative mode

An effect whose Start is Relative SHALL fade in from what is underneath it: the live value the
channel would have without it (another cue's, even a moving one), else the channel's default.
Over its Fade In time (in bars, 0 to 64), each channel it drives SHALL blend from that value to
the running effect's value along the Fade In curve, while the effect keeps moving. A Fade In time
of 0 SHALL start the effect at full strength. An effect whose Start is Absolute SHALL start at
full strength whatever its Fade In.

#### Scenario: Pan/tilt effect over a scene

- **WHEN** a scene holds moving heads at pan 128, and a Relative circle effect with a Fade In of
  2 bars is cued
- **THEN** the heads start at pan 128 and reach the full circle after 2 bars, moving all along

#### Scenario: No fade-in time

- **WHEN** a Relative effect with a Fade In of 0 is cued
- **THEN** it starts at full strength on its first frame, as an Absolute effect does

#### Scenario: Absolute ignores the fade

- **WHEN** an Absolute effect with a Fade In of 2 bars is cued
- **THEN** it starts at full strength on its first frame

### Requirement: Effect fade-out in Relative mode

Stopping a Relative effect with a Fade Out time above 0 SHALL keep it running while each channel
blends into what is underneath it (the next cue's live value, else the channel's default), along
the Fade Out curve, over the Fade Out time. The effect SHALL show as stopped at once and SHALL
release its channels when the fade ends. A Fade Out of 0, or Absolute, SHALL stop the effect at
once. Cueing the effect again during its fade-out SHALL fade it back in from where the fade-out got
to.

#### Scenario: Fade back to the scene

- **WHEN** a Relative effect with a Fade Out of 1 bar, started over a scene, is stopped
- **THEN** after 1 bar its channels hold the scene's values again and the effect is stopped

#### Scenario: One Shot end

- **WHEN** a Relative One Shot effect with a Fade Out reaches the end of its Duration
- **THEN** it shows stopped, fades into what is underneath over its Fade Out, then stops

#### Scenario: Clicking a playing effect

- **WHEN** the tile of a playing effect is clicked
- **THEN** the effect stops: at once when Absolute, over its Fade Out when Relative

#### Scenario: Cued again while fading out

- **WHEN** a fading-out Relative effect is cued again halfway through its fade-out
- **THEN** it fades back in from where its channels are at that moment, with no jump
