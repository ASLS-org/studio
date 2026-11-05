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
