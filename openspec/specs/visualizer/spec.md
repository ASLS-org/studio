# visualizer Specification

## Purpose

Defines what the 3D visualizer shows and how operators select and place fixtures in it, so the view
always matches what the hardware receives and fixture placement stays reliable.

## Requirements

### Requirement: The view shows the output values
The system SHALL render every patched fixture from the DMX values its universe outputs (0-255 per
channel), within one rendered frame of those values changing, whether they come from playback or
from operator edits, and whether the show is playing, paused or stopped.

#### Scenario: Effect on a dimmer
- **GIVEN** a group of moving heads with a dimmer effect looping at 120 BPM
- **WHEN** the show plays
- **THEN** each fixture's beam intensity in the 3D view follows its Dimmer channel value

#### Scenario: Fader edit while paused
- **GIVEN** the show is paused
- **WHEN** the operator drags a fixture's Pan fader in the universe view
- **THEN** the fixture's head turns in the 3D view as the fader moves

### Requirement: Selection highlights fixtures in the view
The system SHALL highlight the fixtures selected in the fixture pool, group or scene editors in the
3D view, and SHALL attach the move/rotate gizmo to them when the selection asks for it.

#### Scenario: Select two fixtures
- **WHEN** the operator selects two fixtures in the universe fixture pool
- **THEN** both are highlighted in the 3D view and the gizmo is attached to them

### Requirement: Placement edits stay in sync
The system SHALL apply a fixture move or rotation made with the gizmo to the fixture's saved
position and rotation, and a value typed in the position tool to the 3D view, in centimetres and
whole degrees.

#### Scenario: Move with the gizmo
- **GIVEN** a selected fixture at X = 0 m
- **WHEN** the operator drags it with the gizmo to X = 2 m
- **THEN** the position tool shows X = 2, and the fixture stays at X = 2 after save and reload

#### Scenario: Type a rotation
- **WHEN** the operator types 90 in the position tool's rotation Z field
- **THEN** the fixture rotates to 90 degrees around Z in the 3D view

### Requirement: Beams light the stage as projectors
The system SHALL light the floor and set pieces with each fixture's beam, shaped by its field angle
and coloured and scaled by its colour and intensity (Dimmer 0-255), with every patched beam lit at
once. A beam at intensity 0 SHALL cast no light. The in-air beam cones stay as they are drawn today.

#### Scenario: Pan moves the light on the floor
- **GIVEN** a moving head aimed at the floor with its dimmer at 255
- **WHEN** the operator drags its Pan fader
- **THEN** the spot of light on the floor follows the beam in the 3D view

#### Scenario: Zoom widens the footprint
- **WHEN** a fixture's zoom goes from its narrowest to its widest field angle
- **THEN** its footprint on the floor grows to match the beam cone

#### Scenario: Forty beams at once
- **GIVEN** 40 patched moving heads, all with the dimmer at 255
- **WHEN** they are aimed at the floor and the walls
- **THEN** every one of them lights the surface it hits

### Requirement: Gobos show on lit surfaces
The system SHALL project the selected gobo of each fixture's gobo wheel into its light on surfaces,
at every quality level that lights surfaces. Wheel slots SHALL map to a built-in set of gobo
patterns by slot number; an open slot gives a plain round spot. Gobo rotation SHALL turn the
pattern, and focus or frost SHALL blur it.

#### Scenario: Select a gobo
- **WHEN** the operator sets a fixture's Gobo Wheel channel to its third slot
- **THEN** the light on the floor shows the third built-in pattern instead of a plain spot

#### Scenario: Rotating gobo
- **WHEN** a fixture with gobo rotation runs a rotation value
- **THEN** the projected pattern turns on the floor at a matching speed

#### Scenario: Frost
- **WHEN** a fixture's frost goes from 0 to 255
- **THEN** the projected pattern goes from sharp to blurred

### Requirement: Quality levels
The system SHALL offer four quality levels: Guides (unlit stage with beam guides), Low (light on the
floor only), Medium (light on every surface at reduced resolution) and High (light on every
surface at full resolution). Changing the level SHALL take effect without reloading the show.

#### Scenario: Switch level during playback
- **GIVEN** a show playing
- **WHEN** the operator changes the quality from High to Low
- **THEN** the floor footprints stay lit, the walls and set pieces are no longer lit, and playback
  continues without a pause

#### Scenario: Guides level
- **WHEN** the quality is Guides
- **THEN** the stage shows no beam light and every beam shows its guide

### Requirement: Adaptive quality
With the quality setting on Auto, the system SHALL choose the starting level from the device's
graphics capabilities, and SHALL lower the resolution, then the level, when frames take longer than
the refresh interval for a sustained period, and raise them again after a sustained period of spare
time, without switching back and forth.

#### Scenario: Software renderer
- **GIVEN** a browser that renders WebGL in software
- **WHEN** the visualizer starts with quality on Auto
- **THEN** it starts at the Guides or Low level

#### Scenario: Heavy rig on a weak machine
- **GIVEN** quality on Auto and a rig whose frames no longer fit the refresh interval
- **WHEN** this lasts for several seconds
- **THEN** the visualizer lowers its resolution or level until frames fit again

#### Scenario: No flicker between levels
- **GIVEN** quality on Auto and a frame time close to the refresh interval
- **WHEN** the visualizer runs for a minute
- **THEN** it does not switch level more than once in either direction

### Requirement: Quality setting is per device
The system SHALL provide a Quality setting (Auto, Guides, Low, Medium, High) and a resolution scale
in the visualizer settings, SHALL keep them on the device across reloads, and SHALL NOT store them
in the showfile or mark the show unsaved when they change. When the device cannot store them, the
setting SHALL fall back to Auto.

#### Scenario: Setting survives reload
- **WHEN** the operator sets quality to Low and reloads the app
- **THEN** quality is still Low

#### Scenario: Not part of the show
- **GIVEN** a saved show with no unsaved changes
- **WHEN** the operator changes the quality
- **THEN** the toolbar shows no unsaved marker, and opening the same showfile on another machine
  uses that machine's own quality setting

#### Scenario: Storage blocked
- **GIVEN** a browser that blocks site storage
- **WHEN** the visualizer starts
- **THEN** quality is Auto and the visualizer works normally

### Requirement: Beam guides
The system SHALL draw for each beam a guide showing its centre line from the lens to where it meets
the floor or the end of the beam, its cone edges and its footprint outline on the floor, in the
beam's colour. Guides SHALL stay sharp at any resolution scale. A Beam guides setting (Auto, On,
Off) SHALL control them; Auto shows them only at the Guides level.

#### Scenario: Guides on at High quality
- **GIVEN** quality on High
- **WHEN** the operator sets Beam guides to On
- **THEN** every beam shows its guide over the lit stage

#### Scenario: Dimmer closed
- **GIVEN** Beam guides shown
- **WHEN** a fixture's dimmer is at 0
- **THEN** its guide still shows, faintly, so its position can be set

#### Scenario: Low resolution
- **GIVEN** a resolution scale of 0.5
- **WHEN** guides are shown
- **THEN** the guide lines are as sharp as at a scale of 1

### Requirement: Render on demand
The system SHALL stop drawing new frames while nothing in the view changes (no DMX value change, no
camera move, no running visual animation such as strobe or gobo rotation), and SHALL resume within
one frame when something changes.

#### Scenario: Idle show
- **GIVEN** the show stopped, the camera still and no strobe or rotating gobo active
- **WHEN** a few seconds pass
- **THEN** the visualizer draws no new frames

#### Scenario: Wake on change
- **GIVEN** the visualizer is idle
- **WHEN** the operator drags a fixture's Dimmer fader
- **THEN** the beam's intensity follows in the 3D view as the fader moves

### Requirement: In-air beams follow the quality level
The system SHALL draw each lit beam in the air, in its colour and intensity and with its field
angle, at the Low, Medium and High quality levels, and SHALL draw no air beam at the Guides level.
Beams SHALL end where they meet the floor. At Medium and High a beam SHALL be hidden where a
fixture body stands in front of it.

#### Scenario: Low level
- **GIVEN** a moving head with its dimmer at 255 and haze density above 0
- **WHEN** the quality is Low
- **THEN** its beam shows in the air as an even haze cone from the lens to the floor

#### Scenario: Guides level
- **WHEN** the quality is Guides
- **THEN** no beam shows in the air, and the beam guides show as before

#### Scenario: Dimmer closed
- **WHEN** a fixture's dimmer is at 0
- **THEN** its beam does not show in the air at any level

### Requirement: Gobos show in the haze at High quality
At the High quality level, the system SHALL show each beam's gobo pattern in the haze as shafts
of light that match the pattern projected on the floor, turning with gobo rotation and blurring
with focus or frost. At Medium the gobo SHALL only soften the beam.

#### Scenario: Gobo shafts
- **GIVEN** quality High, haze density above 0 and a fixture showing a dotted gobo
- **WHEN** the camera looks along the beam
- **THEN** the beam shows separate shafts in the haze that line up with the dots on the floor

#### Scenario: Rotating gobo in the haze
- **WHEN** that fixture's gobo rotates
- **THEN** the shafts in the haze turn with the pattern on the floor

### Requirement: Haze settings
The system SHALL replace the Fogging settings with a Haze Density setting (0-100), saved in the
showfile: one uniform haze, without shape or motion. Density 0 SHALL hide every air beam; higher
density makes beams brighter in the air.

#### Scenario: No haze
- **WHEN** the operator sets haze Density to 0
- **THEN** no beam shows in the air, and light on the floor is unchanged

#### Scenario: Still haze
- **GIVEN** the show stopped and the camera still
- **WHEN** a few seconds pass at any quality level
- **THEN** the visualizer draws no new frames, whatever the haze density

#### Scenario: Haze saved with the show
- **WHEN** the operator sets Density to 40, saves and reloads the show
- **THEN** Density is 40

### Requirement: Older showfiles keep their fog look
The system SHALL open showfiles saved before Haze existed with haze Density 50, since their beams
always showed in the air; their fog settings are ignored.

#### Scenario: Fog disabled in an old showfile
- **GIVEN** a showfile saved with fogging disabled
- **WHEN** it is opened
- **THEN** beams show in the air with haze Density 50

#### Scenario: Demo show
- **GIVEN** the demo showfile (fog settings only)
- **WHEN** it is opened
- **THEN** haze Density is 50, and saving it writes the haze setting

### Requirement: Bloom and lens glow
The system SHALL draw a glow on the lens of each lit fixture, scaled by its intensity, at the Low,
Medium and High levels, and SHALL add a soft bloom around bright beams and lenses at Medium and
High.

#### Scenario: Lens glow
- **WHEN** a fixture's dimmer goes from 0 to 255
- **THEN** its lens glows brighter, in the beam's colour

#### Scenario: No bloom at Low
- **WHEN** the quality is Low
- **THEN** lenses glow without bloom spreading around them

### Requirement: Air beam detail adapts first
With the quality setting on Auto at the High level, the system SHALL lower the detail of the air
beams before lowering the lighting resolution or the level.

#### Scenario: Slow frames at High
- **GIVEN** quality on Auto at High with full resolution
- **WHEN** frames stay slow for several seconds
- **THEN** the air beams lose detail first, and the resolution drops only if frames are still slow

### Requirement: Wider beams spread the same light
The system SHALL keep a beam's total light constant across its field angle: zooming a fixture wider
SHALL make its footprint and its beam in the air dimmer per area, and zooming narrower SHALL make
them brighter, within limits so very narrow or very wide beams stay visible.

#### Scenario: Zoom out
- **GIVEN** a fixture lighting the floor with its dimmer at 255
- **WHEN** its zoom goes from its narrowest to its widest field angle
- **THEN** its footprint grows and gets dimmer, and its beam in the air gets fainter

### Requirement: Beams look smooth and directional
The system SHALL draw beams in the air with soft edges and without visible grain or blocky steps at
every level, brighter when looked at from in front of the fixture than from the side, and SHALL
keep overlapping beams from washing the view out.

#### Scenario: Looking into a beam
- **GIVEN** a beam in haze
- **WHEN** the camera moves from the side of the beam to in front of the fixture
- **THEN** the beam and its lens glow get brighter

#### Scenario: Low level edges
- **WHEN** the quality is Low
- **THEN** beam edges in the air are soft, without visible steps

### Requirement: Light from several beams mixes like real light
The system SHALL add the light of overlapping beams on a surface before applying the scene's tone
curve, so overlapping red, green and blue beams make white, red and green make yellow, and no
footprint shows a visible step where it overlaps another, at every level that lights surfaces.

#### Scenario: RGB overlap
- **GIVEN** three fixtures in red, green and blue whose footprints overlap on the floor
- **WHEN** the quality is Low, Medium or High
- **THEN** the overlap is white, pairs show yellow, cyan and magenta, and no layered edges show

#### Scenario: Grazing beam
- **WHEN** a fixture lights the floor at a grazing angle
- **THEN** its footprint shows in full, up to the end of the beam, without being cut

### Requirement: Exposure setting
The system SHALL provide an Exposure setting (25-400 %, default 100, saved in the showfile) that
scales the brightness of the beams in the air, their lens glow and bloom, and the light they cast
on surfaces through the scene's tone curve. 100 SHALL give the physically scaled result.

#### Scenario: Brighter view
- **WHEN** the operator raises Exposure from 100 to 200
- **THEN** beams and their footprints get brighter and still roll off smoothly instead of clipping

#### Scenario: Showfile without Exposure
- **WHEN** a showfile saved before Exposure existed is opened
- **THEN** Exposure is 100

### Requirement: Zoom follows the fixture's lens
The system SHALL turn a fixture's Zoom channel into its field angle within the fixture's lens
range: zoom values given as "narrow" / "wide" presets or percentages SHALL span the lens's
minimum to maximum angle, and zoom values given in degrees SHALL be used as the field angle.

#### Scenario: Preset zoom
- **GIVEN** a MAC Aura (lens 11-58 degrees, Zoom "wide" to "narrow")
- **WHEN** its Zoom channel goes from 0 to 255
- **THEN** its beam narrows from about 58 to about 11 degrees, never to a pinpoint

### Requirement: Every patched fixture shows in the view
The system SHALL draw every patched fixture in the 3D view, whatever its category, with a body
generated from the fixture's description: its category (moving head, can, bar, panel), its
dimensions, its pan/tilt axes and its beams or cells placed as described.

#### Scenario: OFL PAR
- **GIVEN** a patched OFL `Color Changer` with its dimmer at 255 and red at 255
- **THEN** the view shows a can sized from the fixture's dimensions, with a red beam lighting the
  floor

#### Scenario: OFL pixel bar
- **GIVEN** a patched OFL pixel bar
- **WHEN** a scene lights pixel 3 in blue and the others off
- **THEN** the bar shows its cells in a row, and only the third is blue

#### Scenario: GDTF moving head
- **WHEN** a GDTF moving head's Pan goes from 0 to 255
- **THEN** its yoke and head turn through the fixture's pan range, and the beam follows

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

### Requirement: Each beam of a multi-beam fixture follows its own channels
The system SHALL drive each beam or cell of a GDTF or OFL pixel fixture from its own channels
(dimmer, colour, gobo, zoom), with fixture-wide channels applying to all of them, and SHALL show
every cell lit in its own colour on the fixture. The light a fixture casts on surfaces and in the
haze SHALL combine neighbouring cells that point the same way into a few beams, with their summed
intensity and mixed colour. Cells the fixture describes as not projecting SHALL cast no light.

#### Scenario: Beam colours
- **GIVEN** a patched multi-beam GDTF fixture
- **WHEN** a scene sets beam 1 to red and beam 2 to blue
- **THEN** the view shows a red and a blue beam from the same fixture

#### Scenario: LED wash
- **GIVEN** a GDTF LED wash with 37 cells, all at full white
- **THEN** its lens shows 37 lit cells, and it casts one beam

#### Scenario: Pixel cells
- **GIVEN** a GDTF pixel bar whose cells glow
- **WHEN** a chase lights its cells one after another
- **THEN** the cells light in sequence in the view, and they cast no beams

### Requirement: GDTF gobos show their real image
The system SHALL show a GDTF fixture's gobo wheel images on lit surfaces and, at High quality, in
the haze, in place of the built-in patterns, with rotation, focus and frost applied as for
built-in gobos.

#### Scenario: Real gobo
- **GIVEN** a GDTF fixture whose gobo wheel has images
- **WHEN** its gobo channel selects a gobo slot
- **THEN** the footprint on the floor shows that slot's image

### Requirement: Fixture model detail follows the quality level
The system SHALL draw each fixture type at the mesh detail of the quality level: low at Guides and
Low, standard at Medium, high at High, else the nearest available detail. A fixture type whose
meshes at that detail exceed the level's triangle budget (Guides and Low: 5,000; Medium: 30,000;
High: 150,000) SHALL try the next detail, then fall back to its generated parts.

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

### Requirement: Fixture meshes swap live
Changing the quality level, by hand or on Auto, SHALL swap fixture meshes without reloading the
show and without pausing playback. A fixture SHALL never wait for its meshes to show.

#### Scenario: Switch level during playback
- **GIVEN** a show playing with modelled GDTF fixtures
- **WHEN** the operator changes the quality from Medium to Low
- **THEN** the fixtures swap their meshes and playback continues without a pause

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
