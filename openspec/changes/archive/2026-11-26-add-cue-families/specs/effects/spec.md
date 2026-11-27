## ADDED Requirements

### Requirement: Effect fade-in

An effect, in either Mode, SHALL fade in from what the fixtures show when it starts: the live value
of the cue it covers, even a moving one, else the channel's value. Over its Fade In time (in bars, 0
to 64), each channel it drives SHALL blend into the running effect along the Fade In curve, while
the effect keeps moving. A Fade In of 0 SHALL start it at full strength. A Replace effect SHALL turn
off the cue it covers once faded in.

#### Scenario: Pan/tilt effect over a scene

- **WHEN** a scene holds moving heads at pan 128, and a Layer circle effect with a Fade In of 2
  bars is cued
- **THEN** the heads start at pan 128 and reach the full circle after 2 bars, moving all along

#### Scenario: No fade-in time

- **WHEN** a Layer effect with a Fade In of 0 is cued
- **THEN** it starts at full strength on its first frame

#### Scenario: A Replace effect fades too

- **WHEN** a Replace pan effect with a Fade In of 2 bars is cued over a Position scene
- **THEN** it blends in from the scene's aim over 2 bars, then the scene turns off

### Requirement: Effect fade-out

Stopping an effect, in either Mode, with a Fade Out above 0 SHALL show it stopped at once and keep
it running while each of its families blends back into the cue it covered, else rests (see
playback), along the Fade Out curve. A Fade Out of 0 SHALL hand back at once.
Cueing it again during its fade-out SHALL fade it back in from where the fade-out got to.

#### Scenario: Fade back to the scene

- **WHEN** a Layer effect with a Fade Out of 1 bar, started over a scene, is stopped
- **THEN** after 1 bar its channels hold the scene's values again and the effect is stopped

#### Scenario: One Shot end

- **WHEN** a One Shot effect with a Fade Out reaches the end of its Duration
- **THEN** it shows stopped, fades back over its Fade Out, then stops

#### Scenario: Cued again while fading out

- **WHEN** a fading-out effect is cued again halfway through its fade-out
- **THEN** it fades back in from where its channels are at that moment, with no jump

## MODIFIED Requirements

### Requirement: Add modulated channels

The Add Modulated Channel popup SHALL list every channel type of the effect's family that its
fixtures have, and those of no family (colour mixing channels by colour), each with its
channel icon, those already modulated marked as in use. Picking one or more and OK SHALL add them
with default waves and select the first added.

#### Scenario: Add Zoom
- **WHEN** the operator opens Add Modulated Channel on a Beam effect of heads with a zoom
- **THEN** Zoom is listed with its icon; picking it and OK adds it and selects it

#### Scenario: Colour effect
- **WHEN** the operator opens Add Modulated Channel on a Colour effect of RGB heads
- **THEN** only Red, Green, Blue and the heads' other colour channels are listed

### Requirement: Effect fade settings

The effect modifier SHALL show a Fade In widget and a Fade Out widget, whatever the effect's Mode.
Each widget SHALL have a Bars field (0 to 64) and the same
curve type, presets and control points as a scene's fade. The fade settings SHALL be saved with the
show. A showfile without them SHALL load with both times at 0 and play unchanged.

#### Scenario: Switching Start shows the fades

- **WHEN** the selected effect's Mode is changed from Layer to Replace
- **THEN** its Fade In and Fade Out widgets stay in the effect modifier

#### Scenario: Older showfile

- **WHEN** a showfile saved before this change is loaded
- **THEN** its effects have Fade In and Fade Out times of 0 and start and stop as before

## REMOVED Requirements

### Requirement: Effect fade-in in Relative mode

**Reason**: Relative is now called Layer, and fades blend with the cue underneath.
**Migration**: See "Effect fade-in". Showfiles keep the same stored value.

### Requirement: Effect fade-out in Relative mode

**Reason**: Relative is now called Layer, and the fade-out hands back to the cue underneath.
**Migration**: See "Effect fade-out". Showfiles keep the same stored value.
