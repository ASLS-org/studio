## ADDED Requirements

### Requirement: 16-bit channels play their fine byte

A playing scene SHALL send a 16-bit channel's coarse and fine values together: the output SHALL
carry both bytes as the scene sets them, and a fade SHALL blend them as one 16-bit value.

#### Scenario: A 16-bit dimmer

- **GIVEN** a scene setting a 16-bit dimmer to 200 (coarse) and 128 (fine), no fade
- **WHEN** it plays
- **THEN** the output carries 200 and 128

#### Scenario: Fading a 16-bit dimmer

- **GIVEN** that scene with a Fade In, the dimmer at 0
- **WHEN** it plays and is halfway through its Fade In (linear)
- **THEN** the output carries 100 and 64 (200.5 × 0.5 as one value)
