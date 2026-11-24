## ADDED Requirements

### Requirement: New fixtures are placed in a line

When fixtures are patched, Studio SHALL place them in a line along X, 1 m apart and centred on
X 0. They SHALL be hung 4 m up (mount Hung), except fixtures of the categories Smoke, Hazer, Fan
and Stand, which SHALL stand on the floor (height 0, mount Floor).

#### Scenario: Two PARs patched into the demo rig
- **WHEN** the operator patches two PARs into the demo show (heads hung at 11.5 m)
- **THEN** they appear at X −0.5 and 0.5 m, Y −3 m, height 4 m, hung, and the Position Tool shows
  the mount Hung

#### Scenario: A smoke machine stands on the floor
- **WHEN** the operator patches a fixture of category Smoke on an empty stage
- **THEN** it stands on the floor (height 0, mount Floor) at Y 3 m

### Requirement: New fixtures take a free row

The line SHALL go on the first free row: Y −3, 0, 3, −6, 6, 9 m for hung fixtures, Y 3, 5, 1, 7 m
for floor fixtures. A row is free when no fixture of any universe on it (within 0.5 m of its Y
and 1 m of its height) is within 0.5 m of the line. When no row is free, the line SHALL continue
on the first row, 1 m right of its rightmost fixture.

#### Scenario: A second patch takes the next row
- **WHEN** four moving heads were patched on an empty stage and then two more fixtures are patched
- **THEN** the four are at X −1.5 to 1.5 m on Y −3 m and the two at X −0.5 and 0.5 m on Y 0 m,
  all 4 m up

#### Scenario: Every row taken
- **WHEN** every hung row already holds a fixture at X 0 and two more fixtures are patched
- **THEN** they go on Y −3 m at X 1 and 2 m, right of the fixture already there
