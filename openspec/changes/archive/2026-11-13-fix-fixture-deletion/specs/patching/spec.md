# Spec Delta

## ADDED Requirements

### Requirement: Universe id edits keep their fixtures
Changing a universe's ID SHALL carry its fixtures along: they stay patched in it, and deleting,
selecting or moving them keeps working. An ID another universe already uses SHALL be refused, and
the field SHALL show the universe's current ID again.

#### Scenario: Delete after changing the id
- **GIVEN** universe 0 renumbered to 5 in its settings
- **WHEN** the operator deletes one of its fixtures from the patch bay
- **THEN** the fixture disappears from the patch bay, the universe view and the visualizer

#### Scenario: Id already in use
- **GIVEN** universes 0 and 1
- **WHEN** the operator types 1 as universe 0's ID
- **THEN** the field goes back to 0 and both universes keep their fixtures

### Requirement: Deleting a fixture always completes
Deleting a fixture SHALL remove it from the show, its universe's patch, every group and the
visualizer, even when one of its groups' cues fails to drop it. Such a failure SHALL be reported
and SHALL NOT leave the fixture in the group.

#### Scenario: A cue fails while deleting
- **GIVEN** a fixture used by a group whose cue raises an error when the fixture is dropped
- **WHEN** the operator deletes the fixture
- **THEN** the fixture leaves the group, the universe and the visualizer, and the show saves and
  reopens without error
