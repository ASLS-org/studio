## ADDED Requirements

### Requirement: Choice input

The uikit SHALL have a choice input: a labelled row of buttons, each with an icon and a short name,
exactly one selected, drawn like a toggled button. Clicking a button, or Left and Right while the
row has focus, SHALL select it. A disabled option SHALL show dimmed and SHALL NOT be selected.

#### Scenario: Picking a type

- **WHEN** the Add Cue popup is open and the operator clicks Effect in its Type row
- **THEN** Effect shows selected and Scene doesn't

#### Scenario: Keys

- **WHEN** the Type row has focus with Scene selected and Right is pressed
- **THEN** Effect is selected

### Requirement: List rows with custom content

A list SHALL accept custom content for its rows, keeping everything else of a list row: its height,
the border between rows, hover, selection, focus, keys and, in a reorderable list, the drag grip.

#### Scenario: Cue pool rows

- **WHEN** a cue pool column's row is hovered, then clicked
- **THEN** it shows the list's hover, then its selection, with the cue's picture and value line as
  its content
