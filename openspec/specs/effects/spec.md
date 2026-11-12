# effects Specification

## Purpose

Defines how effect cues modulate fixture channels over time (waveform, frequency, phase and its
spread over fixtures), including fixtures made of several cells.

## Requirements

### Requirement: Effects drive every cell
An effect on a channel kind SHALL modulate every channel of that kind in each of its fixtures,
in every cell and on the whole fixture. Colour effects (red, green, blue) SHALL drive the matching
colour channels of every cell (cyan, magenta and yellow inverted).

#### Scenario: Dimmer effect on a bar
- **GIVEN** an effect with a sine on Dimmer for a group holding one 12-cell bar
- **WHEN** the effect plays
- **THEN** all 12 cell dimmers move

#### Scenario: Older show
- **GIVEN** a show saved before this change with a dimmer effect on a multi-cell fixture
- **WHEN** the effect plays
- **THEN** every cell of the fixture moves, not only the first

### Requirement: Phase across cells
An effect channel SHALL have a **Spread over** option, **Fixtures** (the default) or **Cells**.
With **Cells**, the
effect SHALL spread its phase over every cell of its fixtures, in fixture order then cell order,
with the same direction and phase start and stop as across fixtures. With **Fixtures**, every
cell of a fixture SHALL take that fixture's phase.

#### Scenario: Pixel chase
- **GIVEN** an effect on Dimmer for one 8-cell bar, square wave, phase start 0, phase stop 360,
  direction left to right, **Spread over** set to **Cells**
- **WHEN** the effect plays
- **THEN** each cell's dimmer is offset by 45° from the previous one, so the light runs along
  the bar

#### Scenario: Option off
- **WHEN** **Spread over** is set to **Fixtures**
- **THEN** the 8 cells move together, offset only against the group's other fixtures

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
fixtures (or cells) as **LTR** and **RTL** do. The effect's time SHALL then run forward for one
cycle and backward for the next, so the wave travels across the fixtures one way, then back,
without jumping. **BOUNCELRT** SHALL start travelling as **LTR** does, **BOUNCERTL** as **RTL**
does.

#### Scenario: Back and forth
- **GIVEN** an effect on Dimmer for 4 fixtures, sine, phase start 0, phase stop 360, direction
  **BOUNCELRT**
- **WHEN** the effect plays for two cycles
- **THEN** the brightest point travels as with **LTR** during the first cycle, then back the
  other way during the second, and no fixture jumps at the turn

#### Scenario: Reverse start
- **WHEN** the same effect uses **BOUNCERTL**
- **THEN** the brightest point travels as with **RTL** during the first cycle, then back
