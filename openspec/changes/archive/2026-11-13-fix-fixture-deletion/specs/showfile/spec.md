# Spec Delta

## ADDED Requirements

### Requirement: Shows with dangling fixture references open
Opening a show SHALL skip each universe or group reference to a fixture that isn't in the show's
fixture list, instead of failing, and SHALL report once how many references were dropped. The
show SHALL then be saved locally without them.

#### Scenario: Group refers to a deleted fixture
- **GIVEN** a showfile whose group 0 lists fixture 7, which isn't among the show's fixtures
- **WHEN** the operator opens it
- **THEN** the show opens with group 0's other fixtures, a message says one fixture reference
  was dropped, and opening the saved show again shows no message
