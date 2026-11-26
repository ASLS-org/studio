# Effects

An effect moves channels over time: a dimmer pulse, a colour cycle, heads drawing a circle. Each
**modulated channel** follows a waveform between a minimum and a maximum, and the waveform can be
offset from fixture to fixture (or pixel to pixel) so the movement travels across the rig.

Here the demo rig plays two effects over *Warm wash*'s level. *Rainbow*, a Colour effect, runs red,
green and blue a third of a cycle apart, so the colour cycles through the hues, and spreads the
heads over the cycle, so the colours travel from left to right. *Ballyhoo*, a Position effect,
moves pan and tilt on two sine waves a quarter cycle apart, so the beams draw circles.

<LivePreview preset="effect-stage" />

Create an effect like any cue: click **add** in a column's head in the group's **Cue Pool** and
choose **Effect** (see [Creating a cue](/programming/scenes#creating-a-cue)). An effect moves its
column's family only (a **Position** effect: pan and tilt), plus channels of no family (speeds,
control). To move several families together, as a ballyhoo moving the aim and the dimmer, make an
effect in each column and start them together in a [chase](/programming/chases). Effects loop by
default.
Selecting an effect shows its widgets in the group view: **Modulated Channels**, **Channel
Fixtures Activity**, the selected channel's scope (**Colour Scope** or **Pan/Tilt Scope**), then
the **Effect Tool**, from left to right. An effect whose **Mode** is **Layer** also shows its
**Fade in** and **Fade out** first (see [Fading in and out](#fading-in-and-out)).

## Modulated Channels

Lists the channels this effect moves. Click one to edit it in the **Effect Tool**.

Press **Add** to add a channel. The **Add Modulated Channel** popup lists every channel of the
effect's family that its fixtures have, and those of no family, each with its icon; the
ones the effect already moves say **in use**. Pick
one (<kbd>Ctrl</kbd>/<kbd>⌘</kbd> or <kbd>Shift</kbd> + click for several) and press **OK**: it
joins the effect with a plain wave over its whole range, and is selected. To remove a channel,
select it, press <kbd>Delete</kbd> or <kbd>Backspace</kbd> and confirm.

Selecting a colour channel shows the [Colour Scope](#colour-scope), selecting Pan or Tilt the
[Pan/Tilt Scope](#pan-tilt-scope): their presets and shapes set whole looks in one go.

The preview adds White to *Rainbow*'s Colour effect while it plays: as a Colour effect, it lists
the colour channels only. White first sweeps its whole range, so the colours wash out; narrowing
**Min** and **Max** keeps them soft.

<LivePreview preset="effect-channel-add" />

## Channel Fixtures Activity

Every fixture of the group takes part in each modulated channel by default. Untick a fixture to
leave it out of the selected channel, or use **Check All**. Drag fixtures to change their order:
the order is the one the movement travels in.

## How an effect moves

Each modulated channel follows its waveform between **Min** and **Max**. Every fixture runs the same
waveform, but offset: its **phase**. Spreading the phases makes the movement travel across the rig.
Try the settings below on the demo rig's four heads, with a dimmer effect:

<EffectWave />

- **Phase stop** 0°: every head is at the same point of the wave: they pulse together.
- **Phase stop** 360° with **LTR**: the offsets are 0°, 90°, 180°, 270°: the pulse runs from the
  first head to the last, as a wave.
- **SYM**: the offsets grow from both ends towards the middle: the movement opens and closes like a
  curtain.
- **BOUNCELRT**: the offsets of **LTR**, but the wave runs one way for a cycle, then back the
  other way for the next, smoothly. **BOUNCERTL** starts the other way, as **RTL**.

## Effect Tool

Shapes the selected channel's movement. The graph shows the waveform and where each fixture sits
on it. Below is *Ballyhoo*'s pan: a sine between 92 and 164, twice per effect duration.

<LivePreview preset="effect-wave" />

| Setting | Description |
| --- | --- |
| **Waveform** | The shape: **SINE** (smooth), **TRIANGLE** (straight up and down), **SQUARE** (jumps between min and max), **PWM** (a square whose time at max you set with **Width**) |
| **Width** | With **PWM** only: the share of each cycle spent at **Max**, 1–99 %. At 10 %, short flashes; at 90 %, short blackouts |
| **Min**, **Max** | The channel's lowest and highest value (DMX 0–255) |
| **Freq** | How many times the waveform repeats over the effect's **Duration** (1–100). At 1, a 2-bar effect does one cycle every 2 bars |
| **Phase** | Shifts the whole waveform, in degrees |
| **Direction** | How the offset runs across fixtures: **LTR** first to last, **RTL** last to first, **SYM** from both ends to the middle, **BOUNCELRT** and **BOUNCERTL** back and forth |
| **Mirror** | The second half of the fixtures (in the effect's order; the middle one of an odd count stays) plays the wave flipped: high where the others are low. On **Pan**, heads move as mirror images, left and right; the graph adds the flipped wave, dashed |
| **Spread over** | **Fixtures**: one offset per fixture, a fixture's cells move together. **Cells**: one offset per cell (fixture order, then cell order), so the movement runs along a pixel bar |
| **Phase start**, **Phase stop** | The offset of the first and of the last fixture (or cell), −360° to 360°. Those in between are spread evenly |

With **Phase start** 0 and **Phase stop** 360, the fixtures are spread over one whole cycle: a
"wave" running through the rig. With both at 0, every fixture moves together.

With **Spread over** set to **Cells**, the offsets go from cell to cell: on a pixel bar, a hue
effect runs its colour cycle along the pixels instead of changing the whole bar at once
([Cells](/rig/fixtures#cells) lets you compare both).

> **Note:** An effect moves its channel in every cell of a fixture (each pixel's dimmer, each head's
> pan).

## Colour Scope

Shown while a colour channel (red, green, blue, cyan, magenta, yellow, white or amber) is
selected in **Modulated Channels**, its rows on the left of its fields: one row per fixture,
numbered at its start, with time running across one effect loop. Each row is
painted with the colour that fixture gets at each moment, so a colour travelling across the rig
reads as a diagonal. A line marks the current moment while the effect plays; a fixture switched
off in **Channel Fixtures Activity** shows an empty row. Hover a row to read the fixture, the
moment and its colour (RGB, with a swatch). Below is *Rainbow*.

<LivePreview preset="effect-colour-scope" />

- **Drag a row sideways** to shift the timing of every colour channel (**Phase**), in 15° steps
  (**Shift**: single degrees). The colours follow the pointer.
- **Drag the last row** to spread the colour more or less across the fixtures (**Phase stop**).
- **Phase**, **Speed**, **Phase start** and **Phase stop** set every colour channel at once. A
  field shows `--` when the channels differ; its arrows then step each one from its own value.
- **Spread** places the fixtures, as on the Pan/Tilt Scope (**Custom** when it's none of them).

**Colour A** and **Colour B** are the colours at the two ends of the colour channels: A where
each one is at its **Min**, B where it is at its **Max**. They show the effect's real colours,
whatever made it, and take any colour: click the swatch to pick one, or type its hex code. Changing A or B rewrites red,
green and blue at that end (adding them when missing) and keeps the timing, so on *Rainbow*
(black to white) a B in orange keeps the hues travelling but warms them all.

**Preset** shows the preset the colour channels follow (**Custom** when none matches, after an
edit for instance) and sets every colour channel in one go, from A to B, at the current **Speed**, starting
from its own colours (Police in blue and red, Fire in red and orange…). It adds red, green and
blue when the effect lacks them (they show in **Modulated Channels** at once) and sets the other
colour channels to 0, so a preset never keeps anything from the previous one. A line under the
fields says what it does. When the colours flash (chases, strobes, sparkle), **Width** sets how
long each flash stays lit.

| Preset | Look |
| --- | --- |
| **Rainbow** | Every hue in turn, travelling across the fixtures (black to white) |
| **Fade** | From A to B and back, travelling across the fixtures |
| **Fade together** | The same fade, every fixture at once |
| **Pulse** | B breathing out of A, every fixture at once |
| **Wave** | B rising out of A, travelling across the fixtures |
| **Chase** | One fixture at a time in B, the others in A |
| **Strobe** | Every fixture flashing B together (white on black to start with) |
| **Sparkle** | Short flashes of B here and there |
| **Flip** | Every fixture switching between A and B |
| **Police** | A and B in fast turns (blue and red to start with) |
| **Fire** | A flickering towards B (red and orange to start with) |
| **Ocean** | A and B rolling slowly across (blue and turquoise to start with) |
| **Sunset** | A glowing into B (orange-red and purple to start with) |

## Pan/Tilt Scope

Shown while **Pan** or **Tilt** is selected in **Modulated Channels** (the effect needs both):
the shape the heads draw, on the left of its fields. Making the panel taller enlarges the drawing;
the fields keep their width. The drawing is in **degrees**, from the pan and tilt ranges in the
fixture's profile (540° and 270° when the profile doesn't say), at the same scale across and up,
so a circle on screen is a circle in the air. Two switches stacked next to the drawing, lit while
on, change the view: **Deg** (degrees; off: DMX, 0–255 on both axes) and **Fit** (zoomed on the
shape; off: the whole range). Hover the drawing to read the pan and tilt under the pointer and
the grid's step.

When every fixture follows the same shape, as usual, the shape is drawn once and the fixtures
queue along it while the effect plays: the first fixture is the numbered dot, the others follow
as small faint dots, and a bright stretch of the line shows how far the queue reaches (the
spread). When fixtures follow different shapes, the first one's shape is lit and the others are
faint. Hover a dot to light it and read its number and name. Below is *Ballyhoo*.

<LivePreview preset="effect-pantilt-scope" />

- **Drag inside the dashed box** (or on a dot) to move the shape. **Drag a handle** to resize
  it: an edge handle moves that side, a corner handle two sides at once. Moves snap to the grid;
  hold **Shift** for single DMX steps. The corner shows the range while you drag.
- **Arrow keys** move the shape by one DMX step once you've clicked the field (**Shift**: 10).
- To spread the fixtures along the shape, use **Spread**, or **Phase start** and **Phase stop**.

| Field | Description |
| --- | --- |
| **Centre pan**, **Centre tilt** | The middle of the shape (degrees or DMX, as the field shows). Typing a value moves the shape and keeps its size |
| **Size pan**, **Size tilt** | The shape's width and height. Typing a value keeps the centre |
| **Speed** | How many times the shape runs per effect loop. Both channels keep their ratio |
| **Phase start**, **Phase stop** | The spread of the fixtures along the shape, on both channels |

**Shape** shows the shape the channels draw, or **Custom** when they match none (after an edit
here or in the Effect Tool); picking one sets both channels at once. It keeps the centre, uses the current **Speed**, and gives
back a size a line had flattened, so picking shapes one after another never leaves traces of the
previous one. Round shapes (circles, diagonals, diamond) get the same angle across and up.

| Shape | Movement |
| --- | --- |
| **Circle**, **Circle reverse** | A circle, one way or the other |
| **Ellipse** | A circle stretched to the current width and height |
| **Eight**, **Infinity** | A figure eight standing up, or lying down |
| **Line horizontal**, **Line vertical** | A sweep across, or up and down |
| **Diagonal up**, **Diagonal down** | A sweep along a diagonal |
| **Diamond** | Straight lines between four points |
| **Zigzag**, **Wave** | A sweep across, going up and down four times on the way, sharp or smooth |
| **Swing** | A U, like a pendulum |
| **Clover**, **Knot**, **Ballyhoo**, **Pretzel** | Looping figures, from calm to busy |

**Spread** shows how the fixtures are placed on the shape (**Custom** when it's none of these)
and places them:

| Spread | Fixtures |
| --- | --- |
| **Together** | All at the same place |
| **Wave** | Evenly around the shape, first to last |
| **Reverse** | Evenly, last to first |
| **Mirror** | From both ends towards the middle, the second half mirrored left to right (Mirror on Pan): heads move as mirror images |
| **Half** | Over half the shape |
| **Bounce** | Evenly, the wave running one way then back |

## Timing

An effect's speed comes from its **Duration** in bars (in **Cue Settings**) and its **Freq**, so it
follows the show's tempo: double the BPM and the effect runs twice as fast. See
[Timing and playback](/concepts/timing).

**In the demo show:** both effects last 2 bars. *Rainbow*'s colour has **Freq** 1: one trip around
the hues every 4 s at 120 BPM. *Ballyhoo*'s pan and tilt have **Freq** 2: a circle every 2 s.

## Fading in and out

Every effect fades in and out, as a scene does, whatever its **Mode** (in **Cue Settings**, the
same setting as for [scenes](/programming/scenes#cue-settings)):

- **Starting** it, the effect blends from what is underneath it (the scene, or a cue still playing,
  even a moving one) into the running effect over its **Fade in**. The effect keeps moving all
  along. In **Replace** (new effects), the cue underneath turns off once the effect has faded in;
  in **Layer**, it stays on underneath, its row striped.
- **Stopping** it, its row shows it stopped at once, and the effect blends back into what is
  underneath (a Layer effect's scene) over its **Fade out**, then lets go. With nothing
  underneath, the dimmers go back to where they were before you played anything, and the aim and
  colour stay where the effect left them.
- **Starting it again** while it fades out blends back in from wherever it got to, with no jump.

An effect takes a fixture's whole colour, or both pan and tilt, so two effects never mix: the one
started last holds the family (see [What plays together](/concepts/timing#what-plays-together)).

A **Fade in** and a **Fade out** widget come first among the effect's widgets.
Each has a **Type** (the same curves as a [scene's fade](/programming/scenes#how-a-scene-fades)),
the curve's control points, and **Bars**: how long the fade lasts, 0 to 64 bars. 0 means no fade.

<LivePreview preset="effect-fade" />

A new effect's fades are 0 bars: it starts and stops at once, the heads snapping onto its path.
Give it a **Fade in** to glide onto it.

In a [chase](/programming/chases#the-timeline), an effect fades the same way inside each item: in
from the item's start, out up to its end.

## Recipes

| Look | Channels | Settings |
| --- | --- | --- |
| Slow breathing | Dimmer | SINE, Min 40, Max 255, Phase stop 0 |
| Chaser | Dimmer | SQUARE, Phase stop 360, LTR: one light on at a time, running along |
| Rainbow wave | Red, Green, Blue | Colour Scope preset **Rainbow**: each light a step further round the colour wheel |
| Ballyhoo | Pan, Tilt | Pan/Tilt Scope shape **Circle**, a small size; Phase stop 180 so neighbours turn opposite ways |
| Mirror | Pan, Tilt | Pan/Tilt Scope spread **Mirror**: heads move as mirror images, left and right |
| Symmetric chase | Any | Direction SYM: both ends move together, towards the middle |
