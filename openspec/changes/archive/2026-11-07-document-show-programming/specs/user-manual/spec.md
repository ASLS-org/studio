# Spec Delta

## ADDED Requirements

### Requirement: Manual follows the reader's path
The manual's navigation SHALL be organised as **Getting started**, **Concepts**, **Programming a
show** and **Rig & output**. Programming pages SHALL each cover one task (patching, groups,
scenes, effects, chases, playing a show), in the order a show is built.

#### Scenario: New reader
- **WHEN** a reader opens the manual's navigation
- **THEN** they see Getting started first, then Concepts, then Programming a show with its pages
  in the order a show is built, then Rig & output

### Requirement: Show programming is documented end to end
Every control of the patch bay, the group pool and the universe, group, scene, effect and chase
views SHALL be explained on a manual page under its exact label, with what it does and, for
values, their unit and range (bars, BPM, DMX 0–255, degrees). Each Programming page SHALL show
the controls it explains live, as previews or demos.

#### Scenario: Looking up a control
- **WHEN** a reader searches the manual for a control's label (for example **Trigger Style** or
  **Spread over**)
- **THEN** the search finds the page and section that explain it, with its options and their
  effect

#### Scenario: Values with units
- **WHEN** a reader reads how to set a chase's or cue's duration
- **THEN** the page says it is counted in bars and how the BPM sets a bar's length

### Requirement: First show tutorial
The manual SHALL include a tutorial that takes a reader from a blank show to a playing chase:
patch fixtures, make a group, a scene and an effect, build a chase and play it. Each step SHALL
give the exact actions and show the expected result live.

#### Scenario: Following the tutorial
- **WHEN** a reader follows *Your first show* step by step in Studio
- **THEN** they end with their own chase playing on their fixtures, and each step matched what
  the page showed

### Requirement: Moved pages keep their addresses
A page whose content moved SHALL keep its address with a short note linking to the new page, so
links from outside the manual keep working.

#### Scenario: Old link
- **WHEN** a reader opens an old address such as `/modifiers/group/`
- **THEN** the page says where the content moved and links to it

### Requirement: Documentation matches the app
Manual pages SHALL describe the behaviour of the current release only. Behaviour that doesn't
work in the app SHALL NOT be described as working.

#### Scenario: Broken feature
- **WHEN** a control doesn't do what its label suggests in the current release
- **THEN** the manual doesn't tell readers to use it for that, and a note explains it where
  readers would otherwise get stuck
