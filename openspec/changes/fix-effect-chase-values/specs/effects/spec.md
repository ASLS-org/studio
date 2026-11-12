## ADDED Requirements

### Requirement: PWM waveform with a width
The **PWM** waveform SHALL output **Max** for the first **Width** percent of each cycle and
**Min** for the rest. **Width** SHALL be set per effect channel from 1 to 99 %, SHALL be shown
in the effect tool only while the waveform is **PWM**, and SHALL be saved with the show. A
channel saved without a width SHALL load at 50 %.

#### Scenario: Short pulses
- **GIVEN** an effect channel on Dimmer, waveform **PWM**, **Width** 25 %, Min 0, Max 255
- **WHEN** the effect plays
- **THEN** each cycle the dimmer is at 255 for a quarter of the cycle and at 0 for the rest

#### Scenario: Older show
- **GIVEN** a show saved before this change with a channel on **PWM**
- **WHEN** the show is opened and the effect plays
- **THEN** the channel alternates between Max and Min, half a cycle each, and the show is not
  marked unsaved

#### Scenario: Width follows the waveform
- **WHEN** the waveform is **SINE**, **TRIANGLE** or **SQUARE**
- **THEN** the effect tool doesn't show **Width**

### Requirement: Bounce directions
With the directions **BOUNCELRT** and **BOUNCERTL**, the effect SHALL spread its phase across the
fixtures (or cells) as **LTR** does. The effect's time SHALL then run forward for one cycle and
backward for the next, so the wave travels across the fixtures one way, then back, without
jumping. **BOUNCELRT** SHALL start left to right, **BOUNCERTL** right to left.

#### Scenario: Back and forth
- **GIVEN** an effect on Dimmer for 4 fixtures, sine, phase start 0, phase stop 360, direction
  **BOUNCELRT**
- **WHEN** the effect plays for two cycles
- **THEN** the brightest point moves from the first fixture to the last during the first cycle,
  and from the last back to the first during the second

#### Scenario: Reverse start
- **WHEN** the same effect uses **BOUNCERTL**
- **THEN** the brightest point moves from the last fixture to the first during the first cycle
