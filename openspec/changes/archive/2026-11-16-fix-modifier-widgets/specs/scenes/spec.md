## ADDED Requirements

### Requirement: The fade play dot follows the curve
The fade editor's play dot SHALL sit on the drawn curve, within 2 px, at the point the fade has
reached, while the scene fades in and after any edit of the curve. When the fade completes, the
dot SHALL stay at the curve's end.

#### Scenario: During a fade
- **GIVEN** a scene with a 4-bar EASE_IN fade in, started
- **WHEN** the operator watches the fade editor
- **THEN** the dot moves along the drawn curve from start to end

#### Scenario: After editing the curve
- **GIVEN** a fade stopped halfway
- **WHEN** the operator changes its type to EASE_OUT
- **THEN** the dot sits on the new curve, at the same progress

#### Scenario: At the end
- **GIVEN** the same fade, completed
- **WHEN** the operator looks at the fade editor
- **THEN** the dot is at the curve's end, not back at its start
