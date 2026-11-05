## MODIFIED Requirements

### Requirement: Fixture bodies follow their parts
The system SHALL draw each part of a GDTF fixture with the mesh its imported file provides for
that part (glTF, or 3DS converted on load), sized and placed to the part's model. A part whose
model has no mesh file, whose mesh is missing or unreadable, or whose mesh does not fit its
model's dimensions SHALL be drawn with the shape of its GDTF primitive type (base, yoke and head
from the bundled moving head model; cylinder, sphere, conventional, scanner), else with the shape
of its role. OFL moving heads SHALL keep the bundled model's parts and proportions, sized to their
dimensions, with pan and tilt turning as before.

#### Scenario: GDTF fixture described by primitives only
- **GIVEN** a patched GDTF moving head whose models name the Base, Yoke and Head primitives and no
  mesh file (for example the Fine Art FINE 380 BSW)
- **THEN** the view shows the bundled base, yoke and head parts, each sized to its model

#### Scenario: GDTF fixture with its own meshes
- **GIVEN** an imported GDTF moving head whose file holds glTF meshes for its base, yoke and head
- **WHEN** it is patched
- **THEN** the view shows the manufacturer's base, yoke and head, each sized to its model, and pan
  and tilt turn the yoke and head as with the generated parts

#### Scenario: GDTF fixture with 3DS meshes only
- **GIVEN** an imported GDTF fixture whose file holds 3DS meshes and no glTF mesh
- **THEN** the view shows those meshes, sized to their models

#### Scenario: A mesh that does not fit its model
- **GIVEN** an imported GDTF fixture with one mesh whose proportions differ from its model's
  length, width and height
- **THEN** that part is drawn with its primitive's shape and the other parts with their meshes

#### Scenario: OFL moving head
- **GIVEN** a patched OFL moving head with Pan at 160 and Tilt at 160
- **THEN** its beam points the same way as before this change, from a body sized to the
  fixture's dimensions

## ADDED Requirements

### Requirement: Fixture model detail follows the quality level
The system SHALL pick, per fixture type, the detail level of the meshes it draws from the quality
level in use: the low detail meshes at Guides and Low, the standard ones at Medium and the high
detail ones at High, taking the nearest available detail when the preferred one is missing. Each
quality level SHALL have a triangle budget per fixture type (Guides and Low: 5,000; Medium:
30,000; High: 150,000); when no available detail fits the budget, the fixture type SHALL be drawn
with its generated parts. Changing the quality level, by hand or on Auto, SHALL swap the meshes
without reloading the show and without pausing playback.

#### Scenario: Standard meshes only
- **GIVEN** a patched GDTF fixture whose file holds standard glTF meshes only, 1,000 triangles in
  all
- **THEN** it shows those meshes at every quality level

#### Scenario: High detail meshes at High
- **GIVEN** a patched GDTF fixture whose file holds standard and high detail glTF meshes
- **WHEN** the quality goes from Medium to High
- **THEN** the view swaps to the high detail meshes, and back to the standard ones at Medium

#### Scenario: Meshes over the budget
- **GIVEN** a patched GDTF fixture whose only meshes total 20,000 triangles
- **THEN** it shows its generated parts at Guides and Low and its meshes at Medium and High

#### Scenario: Patch before the meshes are ready
- **WHEN** a GDTF fixture with meshes is patched
- **THEN** it shows at once with its generated parts, which are replaced by its meshes as soon as
  they are read, with no error and no pause in playback

### Requirement: Fixture meshes stay on the device
The system SHALL read fixture meshes only from the GDTF files in this device's library. Meshes
SHALL never be written to a showfile, uploaded or added to the bundled fixtures. A show opened on
a device whose library holds the fixture type SHALL show that file's meshes.

#### Scenario: Save a show with modelled fixtures
- **GIVEN** a show with patched GDTF fixtures drawn with their meshes
- **WHEN** the operator saves the show
- **THEN** the showfile holds no mesh data and is the same as before this change

#### Scenario: Bundled generic fixtures
- **WHEN** a bundled generic GDTF fixture is patched
- **THEN** it is drawn with its generated parts, as before this change
