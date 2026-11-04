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

### Requirement: OFL pixel fixtures have their full channel list
For OFL fixtures with pixel (matrix) channels, the system SHALL patch every pixel channel of the
chosen mode, in the order the fixture defines, named after its pixel (for example `Red 3`), so the
fixture occupies its real number of DMX channels.

#### Scenario: OFL pixel bar footprint
- **GIVEN** an OFL pixel bar whose mode has 3 channels for each of 8 pixels
- **WHEN** the operator patches it at address 1
- **THEN** it occupies addresses 1-24, and Red 3 sits at address 7

#### Scenario: Footprint grew in an older show
- **GIVEN** a show saved with an OFL moving head whose pixel channels used to be dropped
- **WHEN** the show is opened
- **THEN** the fixture opens with its full channel list, and a message names it so the operator
  can check its address
