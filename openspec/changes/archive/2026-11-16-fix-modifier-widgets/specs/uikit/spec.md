## ADDED Requirements

### Requirement: Lists keep row state when their items change
A list SHALL keep each row's selection, highlight, check and unfolded state, matched by the
item's id (else its name), when its items change or a search filters them. Rows whose item is
gone SHALL leave the selection. A row whose id or name changes in place SHALL keep its state.

#### Scenario: Patch while a universe is unfolded
- **GIVEN** universe 0 unfolded in the patch bay
- **WHEN** the operator patches, deletes or renames a fixture, or adds a universe
- **THEN** universe 0 stays unfolded and the remaining selection is unchanged

#### Scenario: Rename a universe
- **GIVEN** universe 0 unfolded in the patch bay
- **WHEN** the operator changes its name in the universe settings
- **THEN** it stays unfolded

#### Scenario: Check during a search
- **GIVEN** a checkable list with "Aura" typed in its search box
- **WHEN** the operator checks a row and clears the search
- **THEN** that row is still checked

### Requirement: The fixture pool fits its rows
The fixture pool widget SHALL be as wide as its widest row needs to show the fixture's icon,
name, address and tools whole, never narrower than 250 px and never wider than 400 px. Beyond
400 px, rows SHALL be cut and scroll on hover.

#### Scenario: Long fixture names
- **GIVEN** a universe whose fixture rows need 330 px
- **WHEN** the operator opens it
- **THEN** the fixture pool is 330 px wide and no row is cut

#### Scenario: Very long names
- **GIVEN** a fixture whose row would need 500 px
- **WHEN** the universe is open
- **THEN** the fixture pool is 400 px wide and that row's name is cut

### Requirement: Widget fields stay inside their widget
Every field of a modifier widget, with its label, SHALL fit inside the widget's padding and SHALL
never overlap a canvas or another field, in any state the widget can show.

#### Scenario: Effect tool phase fields
- **GIVEN** an effect channel selected, with the PWM waveform (its *Width* field shown)
- **WHEN** the operator looks at the effect tool
- **THEN** *Phase start*, *Phase stop* and *Width* end at least 8 px before the wave canvas,
  and no field's text is cut

## REMOVED Requirements

### Requirement: Lists keep row state while their items change
**Reason**: Replaced by "Lists keep row state when their items change", the same behaviour
without the scenario about changing a universe's ID, which can no longer be changed.
**Migration**: None.
