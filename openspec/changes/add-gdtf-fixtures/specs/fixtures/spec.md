## ADDED Requirements

### Requirement: GDTF fixtures play like OFL fixtures
The system SHALL drive a GDTF fixture's channels exactly as an OFL fixture's: every DMX channel
of the chosen mode at its address, 16-bit channels as a coarse and a fine byte, and channel values
set by scenes, effects and faders. Channels SHALL carry the same channel names used for OFL
fixtures (Dimmer, Pan, Tilt, Red, Color Wheel...), so effects and quick accessors apply to them.

#### Scenario: Dimmer and position
- **GIVEN** a patched GDTF moving head
- **WHEN** a scene sets its Dimmer to 255 and its Pan to 128
- **THEN** the output universe carries 255 on its Dimmer address and 128 on its Pan coarse address

#### Scenario: Fine channel
- **WHEN** a fader sets a GDTF fixture's 16-bit Tilt to half
- **THEN** its coarse and fine Tilt addresses carry the matching two bytes

### Requirement: Multi-cell fixtures have one set of channels per cell
For a GDTF fixture made of repeated cells (bars, pixel fixtures, multi-beam heads), the system
SHALL expose each cell's channels separately, in DMX order, and SHALL apply a channel shared by
the whole fixture (for example a master Dimmer) to every cell.

#### Scenario: Pixel bar cells
- **GIVEN** a patched 12-cell RGB bar from GDTF
- **WHEN** a scene sets cell 3's Red to 255 and the others to 0
- **THEN** only the third cell's Red address carries 255
