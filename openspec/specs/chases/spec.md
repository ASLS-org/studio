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
