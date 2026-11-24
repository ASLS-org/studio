## MODIFIED Requirements

### Requirement: Cues fade in chases as they do on their own

In a chase, an effect SHALL fade only when its Start is Relative. A Relative cue SHALL fade from,
and back into, what is underneath it while its item plays (the live value the channel would have
without it, else its default). An Absolute scene SHALL fade in from 0 and out into what is
underneath. An item that ends SHALL keep its cue's look, as an ended scene does, until the chase
stops or a later or higher cue takes its channels.

#### Scenario: Absolute effect

- **WHEN** a chase plays an item holding an Absolute effect with a 1-bar Fade In
- **THEN** the effect plays at full strength from the item's start
