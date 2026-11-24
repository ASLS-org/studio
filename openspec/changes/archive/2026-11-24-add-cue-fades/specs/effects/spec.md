## ADDED Requirements

### Requirement: Effect fade-in in Relative mode

An effect whose Start is Relative SHALL fade in from the values its channels held when it was
cued. Over its Fade In time (in bars, 0 to 64), each channel it drives SHALL go from that value to
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
goes back to the value it recorded at the start, along the Fade Out curve, over the Fade Out
time. The effect SHALL show as stopped at once, and SHALL leave the channels at the recorded
values when the fade ends. A Fade Out of 0, or Absolute, SHALL stop the effect at once, as before. Cueing the
effect again during its fade-out SHALL start a new fade-in from the channels' current values.

#### Scenario: Fade back to the scene

- **WHEN** a Relative effect with a Fade Out of 1 bar, started over a scene, is stopped
- **THEN** after 1 bar its channels hold the scene's values again and the effect is stopped

#### Scenario: One Shot end

- **WHEN** a Relative One Shot effect with a Fade Out reaches the end of its Duration
- **THEN** it shows stopped, fades back over its Fade Out, then stops

#### Scenario: Clicking a playing effect

- **WHEN** the tile of a playing effect is clicked
- **THEN** the effect stops: at once when Absolute, over its Fade Out when Relative

#### Scenario: Cued again while fading out

- **WHEN** a fading-out Relative effect is cued again halfway through its fade-out
- **THEN** it fades in from where its channels are at that moment, with no jump

### Requirement: Effect fade settings

The effect modifier SHALL show a Fade In widget and a Fade Out widget when the effect's Start is
Relative, and hide them when it is Absolute. Each widget SHALL have a Bars field (0 to 64)
and the same curve type, presets and control points as a scene's fade. The fade settings SHALL be
saved with the show. A showfile without them SHALL load with both times at 0 and play unchanged.

#### Scenario: Switching Start shows the fades

- **WHEN** the selected effect's Start is changed from Absolute to Relative
- **THEN** the Fade In and Fade Out widgets appear in the effect modifier

#### Scenario: Older showfile

- **WHEN** a showfile saved before this change is loaded
- **THEN** its effects have Fade In and Fade Out times of 0 and start and stop as before
