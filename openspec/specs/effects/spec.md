# effects Specification

## Purpose

Defines how effect cues modulate fixture channels over time (waveform, frequency, phase and its
spread over fixtures), including fixtures made of several cells.

## Requirements

### Requirement: Effects drive every cell
An effect on a channel kind SHALL modulate every channel of that kind in each of its fixtures,
in every cell and on the whole fixture. Colour effects (red, green, blue) SHALL drive the matching
colour channels of every cell (cyan, magenta and yellow inverted).

#### Scenario: Dimmer effect on a bar
- **GIVEN** an effect with a sine on Dimmer for a group holding one 12-cell bar
- **WHEN** the effect plays
- **THEN** all 12 cell dimmers move

#### Scenario: Older show
- **GIVEN** a show saved before this change with a dimmer effect on a multi-cell fixture
- **WHEN** the effect plays
- **THEN** every cell of the fixture moves, not only the first

### Requirement: Phase across cells
An effect channel SHALL have a **Spread over** option, **Fixtures** (the default) or **Cells**.
With **Cells**, the
effect SHALL spread its phase over every cell of its fixtures, in fixture order then cell order,
with the same direction and phase start and stop as across fixtures. With **Fixtures**, every
cell of a fixture SHALL take that fixture's phase.

#### Scenario: Pixel chase
- **GIVEN** an effect on Dimmer for one 8-cell bar, square wave, phase start 0, phase stop 360,
  direction left to right, **Spread over** set to **Cells**
- **WHEN** the effect plays
- **THEN** each cell's dimmer is offset by 45° from the previous one, so the light runs along
  the bar

#### Scenario: Option off
- **WHEN** **Spread over** is set to **Fixtures**
- **THEN** the 8 cells move together, offset only against the group's other fixtures

### Requirement: PWM waveform with a width
The **PWM** waveform SHALL output **Max** for the first **Width** percent of each cycle and
**Min** for the rest. **Width** SHALL be set per effect channel from 1 to 99 %, SHALL be shown
in the effect tool only while the waveform is **PWM**, and SHALL be saved with the show. A
channel saved without a width SHALL load at 50 %.

#### Scenario: Short pulses
- **GIVEN** an effect channel on Dimmer, waveform **PWM**, **Width** 25 %, Min 0, Max 255
- **WHEN** the effect plays
- **THEN** each cycle the dimmer is at 255 for a quarter of the cycle and at 0 for the rest

#### Scenario: Older show
- **GIVEN** a show saved before this change with a channel on **PWM**
- **WHEN** the show is opened and the effect plays
- **THEN** the channel alternates between Max and Min, half a cycle each, and the show is not
  marked unsaved

#### Scenario: Width follows the waveform
- **WHEN** the waveform is **SINE**, **TRIANGLE** or **SQUARE**
- **THEN** the effect tool doesn't show **Width**

### Requirement: Bounce directions
With the directions **BOUNCELRT** and **BOUNCERTL**, the effect SHALL spread its phase across the
fixtures (or cells) as **LTR** and **RTL** do. The effect's time SHALL then run forward for one
cycle and backward for the next, so the wave travels across the fixtures one way, then back,
without jumping. **BOUNCELRT** SHALL start travelling as **LTR** does, **BOUNCERTL** as **RTL**
does.

#### Scenario: Back and forth
- **GIVEN** an effect on Dimmer for 4 fixtures, sine, phase start 0, phase stop 360, direction
  **BOUNCELRT**
- **WHEN** the effect plays for two cycles
- **THEN** the brightest point travels as with **LTR** during the first cycle, then back the
  other way during the second, and no fixture jumps at the turn

#### Scenario: Reverse start
- **WHEN** the same effect uses **BOUNCERTL**
- **THEN** the brightest point travels as with **RTL** during the first cycle, then back

### Requirement: Pan/Tilt Scope

When the selected effect has a Pan and a Tilt wave, the effect panel SHALL show a Pan/Tilt Scope:
a grid with no values drawn on it, the path, and a dot per active fixture moving while the
effect plays. Hovering the graph SHALL show the pan and tilt under the pointer and the grid step.
Dots SHALL not be draggable. Without both waves the widget SHALL be hidden.

#### Scenario: Ballyhoo shows its fixtures
- **WHEN** the operator opens the demo's Ballyhoo effect
- **THEN** the scope shows one path and a dot per head, the first one numbered

#### Scenario: A colour-only effect
- **WHEN** the operator opens the demo's Rainbow effect (no Pan or Tilt wave)
- **THEN** no Pan/Tilt Scope is shown

### Requirement: Fixtures as a queue

When every fixture follows the same path (shifted in time), the scope SHALL draw it once with
fixture 1 lit and numbered, the others as faint dots queued along it, and a brighter arc along
the path from the first fixture to the last. When paths differ, fixture 1's path and dot SHALL
be lit and every other path and dot faint. Hovering a dot SHALL light that fixture and name it.

#### Scenario: Sixteen heads on a circle
- **WHEN** sixteen heads run one circle spread over half a turn
- **THEN** one circle shows, head 1 lit, fifteen faint dots behind it and an arc over half the circle

### Requirement: Pan/Tilt in degrees

The Pan/Tilt Scope SHALL draw in degrees by default: the first fixture's pan and tilt ranges from
its profile (540° and 270° when it gives none), centred on 0, at one scale on both axes. A DMX
view SHALL show 0-255 on both axes instead.

#### Scenario: A circle looks round
- **WHEN** the operator picks the Circle shape on fixtures with 540° pan and 270° tilt
- **THEN** the path is a circle in the Degrees view, and the Pan wave spans twice the DMX of Tilt

### Requirement: Shape the pan/tilt path by dragging

Dragging inside the path's box SHALL move it (Pan and Tilt Min and Max shift together within
0-255); dragging an edge handle SHALL move that end of the Pan or Tilt span, a corner handle one
end of each. Drags SHALL snap to
the grid step, single steps with Shift. With the scope focused, arrow keys SHALL move the path by
1 DMX step (10 with Shift). Dots and handles SHALL take the pointer within at least 8 px.

#### Scenario: Move the path on the grid
- **WHEN** the operator drags the path right by two grid steps and a bit
- **THEN** the Pan Min and Max move by two grid steps and Tilt is unchanged

#### Scenario: Resize from a corner
- **WHEN** the operator drags the bottom-right corner handle right and down
- **THEN** the Pan high end rises and the Tilt low end falls, the other ends stay

#### Scenario: Nudge with the keys
- **WHEN** the scope is focused and the operator presses Arrow Up
- **THEN** the Tilt Min and Max rise by 1

### Requirement: Pan/Tilt fields

The scope SHALL show Centre and Size for pan and tilt (in the view's unit, degrees or DMX), Speed
(cycles of the shape per loop) and Phase start/stop. Typing a Centre keeps the size, a Size keeps
the centre, within 0-255 DMX. Speed SHALL scale both waves' Freq together. Phase start/stop SHALL
set both waves, the Tilt wave's scaled by its Freq over the Pan wave's.

#### Scenario: Type a size in DMX
- **WHEN** in the DMX view the operator types Size pan 40 with Centre pan 128
- **THEN** the Pan wave runs from 108 to 148

### Requirement: Pan/Tilt shapes

The scope SHALL offer at least 14 shapes (circles both ways, eight, infinity, lines, diagonals,
diamond, zigzag, wave, swing and Lissajous figures). A shape SHALL set every field it relies on
(waveform, frequency ratio, phase offset) from the current Speed, keep the centre, restore a size
a line had flattened, and make round shapes equal in degrees. Applying shapes in any order SHALL
give the same result as applying the last one alone.

#### Scenario: No traces of the previous shape
- **WHEN** the operator picks Line H, then Circle
- **THEN** the result equals picking Circle alone: round, with the size from before the line

### Requirement: Spread patterns

Both scopes SHALL offer spreads Together, Wave, Reverse, Mirror, Half and Bounce, setting the
direction and Phase start/stop of the waves the scope draws, and Mirror on the Pan wave for the
Mirror spread only.

#### Scenario: Mirror
- **WHEN** the operator picks Mirror on the Pan/Tilt Scope
- **THEN** both waves are SYM with Phase start 0 and stop 360, Pan mirrored and Tilt not

### Requirement: Mirror a modulated channel

A modulated channel SHALL have a Mirror option, saved with the show (off when missing): the second
half of its active fixtures, in effect order (the middle one of an odd count left out), SHALL
play its wave flipped, Min + Max − value. The Effect Tool SHALL show it as a toggle and draw the
flipped wave dashed; the scopes SHALL draw mirrored fixtures where they play.

#### Scenario: Heads as mirror images
- **WHEN** an effect circles 4 heads with SYM spread and Mirror on for Pan
- **THEN** heads 1 and 4 have pan values adding up to Min + Max and the same tilt, at any time

#### Scenario: An older show
- **WHEN** a showfile saved before Mirror existed is loaded
- **THEN** every channel has Mirror off and plays as before

### Requirement: Colour Scope

When the selected effect has a colour wave (Red, Green, Blue, Cyan, Magenta, Yellow, White,
Amber), the effect panel SHALL show a Colour Scope: a row per fixture in effect order, numbered
on the row, painted with its colour across one loop (a colour without a wave counts as 0), a
playhead while playing, an empty row for a fixture switched off. Hovering SHALL show the fixture,
the moment and its RGB with a swatch.

#### Scenario: Rainbow travels across the heads
- **WHEN** the operator opens the demo's Rainbow effect
- **THEN** each row shows the hue cycle, each shifted from the one above

### Requirement: Shape the colour spread by dragging

Dragging a row sideways SHALL shift every colour wave's Phase so the colours follow the pointer
(a full width is one loop), within 0-360°; dragging the last row SHALL change their Phase stop
(within -360° to 360°). Drags SHALL snap to 15°, single degrees with Shift.

#### Scenario: Shift the timing
- **WHEN** the operator drags the strip (Freq 1) a quarter width right
- **THEN** every colour wave's Phase goes down by 90°

### Requirement: Colour fields

The Colour Scope SHALL show Phase, Speed, Phase start and Phase stop for every colour wave: the
shared value or `--` when they differ. Typing sets every colour wave; arrows step each from its
own value; Speed scales every colour wave's Freq together.

#### Scenario: Line the fixtures up
- **WHEN** the operator types Phase stop 0
- **THEN** every colour wave's Phase stop is 0 and all rows show the same colours

### Requirement: Colour presets

The Colour Scope SHALL offer at least 12 presets. A preset SHALL set every colour wave it uses in
full from the current Speed (adding missing Red, Green and Blue, other colour waves at 0), so
presets applied in any order give the last one's result. It SHALL describe itself in one line.

#### Scenario: No traces of the previous preset
- **WHEN** the operator picks Strobe, then Police, then Fade
- **THEN** the result equals picking Fade alone (no PWM width, Freq from the Speed)

### Requirement: Colour A and B

The Colour Scope SHALL show Colour A and Colour B for any effect: the colour of every colour
wave's Min (A) and Max (B), mixed. Setting one to any colour SHALL set red, green and blue at
that end (adding missing waves) and the other colour waves to 0 there, leaving waveforms and
phases as they are. Every preset SHALL run its waves from A to B, starting from its own colours.

#### Scenario: A warmer rainbow
- **WHEN** on Rainbow (A black, B white) the operator sets Colour B to orange
- **THEN** the hues keep their offsets and the Max of red, green and blue become orange's values

#### Scenario: Police in other colours
- **WHEN** the operator picks Police (A blue, B red) and sets B to indigo
- **THEN** the fixtures alternate between blue and indigo

### Requirement: PWM width

When a colour wave runs PWM, the Colour Scope SHALL show a Width field (1-99 %) that sets the
width of every PWM colour wave.

#### Scenario: Longer chase steps
- **WHEN** with Chase the operator types Width 30
- **THEN** every colour wave's PWM width is 30

### Requirement: Modulated channels follow the scopes

Between Channel Fixtures Activity and the Effect Tool, the effect panel SHALL show the Colour
Scope while a colour channel is selected in Modulated Channels and the Pan/Tilt Scope while Pan
or Tilt is selected; the list SHALL show a channel a scope adds at once.

#### Scenario: Rainbow adds blue
- **WHEN** the effect has no Blue wave and the operator picks Rainbow
- **THEN** Blue appears in Modulated Channels

### Requirement: Add modulated channels

The Add Modulated Channel popup SHALL list every channel type of the effect's family that its
fixtures have, and those of no family (colour mixing channels by colour), each with its
channel icon, those already modulated marked as in use. Picking one or more and OK SHALL add them
with default waves and select the first added.

#### Scenario: Add Zoom
- **WHEN** the operator opens Add Modulated Channel on a Beam effect of heads with a zoom
- **THEN** Zoom is listed with its icon; picking it and OK adds it and selects it

#### Scenario: Colour effect
- **WHEN** the operator opens Add Modulated Channel on a Colour effect of RGB heads
- **THEN** only Red, Green, Blue and the heads' other colour channels are listed

### Requirement: A colour field in the uikit

The uikit SHALL have a colour field (`uk-color-input`) styled like the other fields: a label,
then a box with a swatch opening the system colour picker and the colour's hex code, editable.

#### Scenario: Type a hex code
- **WHEN** the operator types `ff8000` in a colour field and presses Enter
- **THEN** the field takes #FF8000 and reports it

### Requirement: Selects show what the waves are

The Shape, Spread and Preset selects SHALL show the shape, spread or preset the waves currently
match (the last one picked when several match), and Custom when none does, following every edit
made anywhere (a field, a drag, the Effect Tool, another select).

#### Scenario: A preset's spread shows
- **WHEN** the operator picks the Strobe preset
- **THEN** the Spread select shows Together

#### Scenario: Custom after an edit
- **WHEN** the operator picks Circle, then changes the Tilt phase in the Effect Tool
- **THEN** the Shape select shows Custom

### Requirement: Scope layout

Each scope SHALL keep its fields at a fixed width with its drawing on their left, flush with the
widget. The Pan/Tilt view switches (Deg, Fit) SHALL be square toggles stacked next to the graph,
lit while on; the Colour Scope's Preset and Spread SHALL share its first row half and half.

#### Scenario: A taller panel
- **WHEN** the operator makes the modifier panel taller
- **THEN** the Pan/Tilt field grows and the fields keep their width

### Requirement: Effect fade settings

The effect modifier SHALL show a Fade In widget and a Fade Out widget, whatever the effect's Mode.
Each widget SHALL have a Bars field (0 to 64) and the same
curve type, presets and control points as a scene's fade. The fade settings SHALL be saved with the
show. A showfile without them SHALL load with both times at 0 and play unchanged.

#### Scenario: Switching Start shows the fades

- **WHEN** the selected effect's Mode is changed from Layer to Replace
- **THEN** its Fade In and Fade Out widgets stay in the effect modifier

#### Scenario: Older showfile

- **WHEN** a showfile saved before this change is loaded
- **THEN** its effects have Fade In and Fade Out times of 0 and start and stop as before

### Requirement: Effect fade-in

An effect, in either Mode, SHALL fade in from what the fixtures show when it starts: the live value
of the cue it covers, even a moving one, else the channel's value. Over its Fade In time (in bars, 0
to 64), each channel it drives SHALL blend into the running effect along the Fade In curve, while
the effect keeps moving. A Fade In of 0 SHALL start it at full strength. A Replace effect SHALL turn
off the cue it covers once faded in.

#### Scenario: Pan/tilt effect over a scene

- **WHEN** a scene holds moving heads at pan 128, and a Layer circle effect with a Fade In of 2
  bars is cued
- **THEN** the heads start at pan 128 and reach the full circle after 2 bars, moving all along

#### Scenario: No fade-in time

- **WHEN** a Layer effect with a Fade In of 0 is cued
- **THEN** it starts at full strength on its first frame

#### Scenario: A Replace effect fades too

- **WHEN** a Replace pan effect with a Fade In of 2 bars is cued over a Position scene
- **THEN** it blends in from the scene's aim over 2 bars, then the scene turns off

### Requirement: Effect fade-out

Stopping an effect, in either Mode, with a Fade Out above 0 SHALL show it stopped at once and keep
it running while each of its families blends back into the cue it covered, else rests (see
playback), along the Fade Out curve. A Fade Out of 0 SHALL hand back at once.
Cueing it again during its fade-out SHALL fade it back in from where the fade-out got to.

#### Scenario: Fade back to the scene

- **WHEN** a Layer effect with a Fade Out of 1 bar, started over a scene, is stopped
- **THEN** after 1 bar its channels hold the scene's values again and the effect is stopped

#### Scenario: One Shot end

- **WHEN** a One Shot effect with a Fade Out reaches the end of its Duration
- **THEN** it shows stopped, fades back over its Fade Out, then stops

#### Scenario: Cued again while fading out

- **WHEN** a fading-out effect is cued again halfway through its fade-out
- **THEN** it fades back in from where its channels are at that moment, with no jump
