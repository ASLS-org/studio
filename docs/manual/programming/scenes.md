# Scenes

A scene holds values for one family of a group's channels (a colour, a position, a dimmer level),
reached with a fade when you play it. Scenes and [effects](/programming/effects) are the group's
**cues**, kept in its **Cue Pool**.

Here the demo rig plays its scenes: *Warm wash*'s level, then its amber colour, then *Sunset*'s
colour over it, deep red to gold. Each fades from where the lights are to the scene's values over
its **Fade in** (one bar, 2 s), and stays on. Stopping *Sunset* brings *Warm wash*'s colour back,
as it is still on underneath. A scene sets one family: *Warm wash* has a scene in each column it
uses, all named *Warm wash*.

<LivePreview preset="scene-stage" />

## The Cue Pool

The cue pool is where you build a group's cues. It has one column per **family**, what a cue
controls, so the layout says what each cue does:

| Column | Its cues set |
| --- | --- |
| **Intensity** | Dimmer, shutter, strobe |
| **Colour** | Colour mixing, colour wheels, colour temperature |
| **Position** | Pan and tilt |
| **Beam** | Zoom, focus, gobos, prisms, iris, frost |

A cue sets one family. A group plays one cue per family at a time: a colour cue plays alongside a
movement cue, and replaces another colour cue (see
[What plays together](/concepts/timing#what-plays-together)). To change several families at once,
play a cue in each column, or put them in a [chase](/programming/chases) as items starting
together. The demo at the top of this page plays in it; try it yourself in
[Playing a show](/programming/playback#cues).

> **Note:** A show saved before cues had one family each may hold cues setting several. Studio
> splits each into one cue per family it sets, with the same name, each in its column; its chase
> items are copied to each. Save the show to keep it that way.

**Each column's head** holds the family's name, its **add** button and its **NOW** line:
what the stage shows of the family on the group's fixtures (the level, the colour, the aim, the
zoom) and where it comes from. NOW only shows; a click on it does nothing.

| NOW reads | Means |
| --- | --- |
| a cue's name | That cue holds the family |
| a cue and a chase (*Red · Verse*) | An item of that chase holds it |
| "kept:" a cue's name | No cue holds it: the fixtures keep that cue's colour, aim or beam as it was when it stopped, until another cue takes the family |
| rest | Nothing holds it: the dimmers are back where they were before you played anything |

Under its head, a column lists its cues as rows, like any list in Studio; when it has more than the
strip shows, scroll it (or make the bottom strip taller by dragging its top border).

**Each cue is a row**, told apart by what it does, not by a colour:

- the picture on its left shows what the cue sets: its colour, its level, the first fixture's aim,
  a beam as wide as its zoom, an effect's waves (one cycle each, whatever their speed; several
  layered, each fainter) or the first fixture's path, filling the picture;
- its second line says it in words: *75%*, *Red*, *Pan 30° Tilt 45°*, *Zoom 40% · Gobo 3*, or
  what an effect moves and its length (*Dimmer · 1 bar*);
- the small icon by its name says whether it is a scene or an effect;
- with the pointer on the row, a play button shows over its picture (a stop button while the cue
  plays, shown whether the pointer is there or not);
- a playing cue shows it as a playing chase does in the group pool: the row fills across with its
  progress (a scene's fade in, then full; an effect's pass) and its stop button blinks. Striped
  means on, but covered: other cues hold every family it sets, and it comes back when they stop;
- a stopped cue whose values the stage keeps (NOW reads "kept:" it) keeps its fill where it was
  when it stopped: full for a scene that had faded in, part way for one stopped during its fade in
  or for an effect.

| Action | Does |
| --- | --- |
| Click a row, or <kbd>↑</kbd> <kbd>↓</kbd> in its column | Opens the cue in the editor, without playing it (see below) |
| Its **play** button, over its picture | Plays or stops the cue with its fades (hold it for a **Temporary** cue) |
| Drag a row by its grip (the dots at its right) | Reorders the column: the other rows slide apart where it will land; <kbd>Esc</kbd> cancels |
| Its trash icon, or <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Deletes the cue after a confirmation, from every chase too |

### Programming Blind

A click on a row only opens the cue: the stage doesn't change, and editing a cue that isn't playing
doesn't either. To see what you program, press the cue's play button: a playing cue's changes show
as you make them. Stop it with the same button.

## Creating a Cue

1. Open the group (click it in the group pool).
2. In the **Cue Pool**, click **add** in the head of the column the cue belongs to. The cue takes
   that column's family: its editor shows that family's channels only.
3. Pick its **Type**: **Scene** (values, reached with a fade) or **Effect** (waves, in bars).
4. Give it a **Name** (it follows the column, like *Colour 3*, until you type one) and press
   **OK**. It ends the column, opened in the editor; it doesn't play until you press its play
   button.

A new cue, scene or effect, **Replaces** what holds its family: that cue turns off. Set its
**Mode** to **Layer** in **Cue Settings** to play over it instead and give it back when you stop
it. A cue's type can't be changed later; its name and mode can, in
**Cue Settings**, and its family while it sets nothing yet (which moves it to another column).

The preview adds an Intensity scene *Blackout* while *Warm wash* plays: it opens, and the rig
doesn't change. The next sections give it values.

<LivePreview preset="cuepool-add" />

## Cue Settings

These are the settings of *Sunset*'s Colour scene, in two columns (an effect adds its **Loop
Style** and **Duration** at their foot): **Layer** mode, so it plays over the colour cue it covers
and gives it back. A cue's fade times are in its **Fade in** and **Fade out** widgets (see
[Fade In and Fade Out](#fade-in-and-fade-out)).

<LivePreview preset="cue-settings" />

| Setting | Description |
| --- | --- |
| **Name** | The cue's name |
| **Family** | What the cue controls, and its column: **Intensity**, **Colour**, **Position** or **Beam**. Its editor shows that family's channels, and those of no family (speeds, control). It can be changed while the cue sets nothing yet |
| **Loop Style** | Effects only. **One Shot** plays the effect once; **Loop** repeats it until you stop it |
| **Trigger Style** | **Toggle**: a click starts the cue, the next click stops it. **Temporary**: the cue plays while you hold the mouse button on it, and stops when you release it, as a flash button. A flash covers what it reaches and hands it back, never turning a cue off |
| **Mode** | What happens to the cue it takes over. **Replace**: that cue turns off once this one has faded in. **Layer**: this cue plays over it and gives it back when you stop it. Every cue fades in and out, effects too (see [Fading in and out](/programming/effects#fading-in-and-out)) |
| **Duration** | Effects only: how long one pass of the effect lasts, in bars (see [Timing and playback](/concepts/timing)) |

A scene has no **Loop Style** or **Duration**: it stays on until you turn it off or a **Replace**
cue takes all of its families.

> **Note:** Turning a scene off fades it out over its **Fade out**, into the cue it hands its
> families back to. With nothing there, the dimmers go back to where they were before you played
> anything, and colour, aim and beam stay as they were (NOW reads "kept:") until another cue
> takes them. Rest the
> pointer on any setting in **Cue Settings** to see what it does. See
> [What plays together](/concepts/timing#what-plays-together).

### How a scene fades

Over its **Fade in** time, a scene moves each active channel from what the lights show to the
scene's value, following its **Fade in** curve, so a new look never dips through dark:

<SceneFade />

## Setting a Scene's Values

When a scene is selected, the group view shows the scene's widgets. Values you set here are the
scene's **end values**: where the fixtures arrive when the scene has faded in. Below is *Sunset*:
click a head in **Scene Fixtures** to see its values (each has its own colour, from deep red on
*MAC Aura 1* to gold on *MAC Aura 4*).

<LivePreview preset="scene-modifier" />

1. In **Scene Fixtures**, click the fixture to set. Hold <kbd>Ctrl</kbd> to select several: changes
   then apply to each of them.
2. Only **active** channels are part of the scene. In **Channels**, tick the box under a fader to
   include its channel: the fader stays greyed out until then. The **Color Picker** and
   **Pan/Tilt** activate the channels they set.
3. Set the values with the faders (DMX 0–255), the **Color Picker** or **Pan/Tilt**.

When several fixtures are selected, the channels widget shows every channel any of them has; a value
goes to the fixtures that have that channel.

> **Note:** In this release, <kbd>Ctrl</kbd>-selecting several fixtures doesn't work in the group's
> first cue (the one selected when the group opens): set its fixtures one at a time
> ([Known limitations](/reference/limitations#programming)).

Channel faders are labelled by position (**CH1**, **CH2**…). As in the universe view, the channel's
name box (under its value) shows its function and current range, and opens its ranges
([Channels](/programming/patching#channels)). Picking one sets the channel to that range's start
and includes it in the scene (it ticks its checkbox). With several fixtures selected, the
ranges are listed only when they are the same for every fixture behind that fader.

### Cells

For fixtures with cells (pixel bars and matrices, multi-head fixtures), the **Cells** widget lists
them after **All cells**:

- **All cells** (the default): one fader per kind of channel (one **Dimmer**, one **Red**…) sets it
  in every cell.
- Click a cell to set it alone, or hold <kbd>Ctrl</kbd> to pick several.

Channels of the whole fixture (a master dimmer, a strobe) are always shown. The scene keeps each
cell's value, so one scene can give every pixel its own colour ([Cells](/rig/fixtures#cells) shows
it on a pixel bar).

### Color Picker and Pan/Tilt

They work as in the universe view (see [Trying a fixture](/programming/patching#trying-a-fixture)),
on the scene's selected fixtures and cells.

### Tips

- **One scene per family.** A Colour scene plays alongside a Position scene: each keeps its own
  family. *Warm wash* and *Sunset* have a scene in each family they use; playing *Sunset*'s
  colour changes only the colour.
- **Program with the scene playing.** Press its play button, then move its faders: the lights
  follow, so you see the look as you build it.
- **Check it from black.** A scene fades from what played before; play it on a dark stage once to
  see its own values.

## Fade In and Fade Out

The **Fade in** widget shapes how the scene moves from its start values to its own values when it
starts: a curve from start (bottom left) to end (top right). The **Fade out** widget, next to it,
shapes how it leaves when you turn it off. Each has its own time.

In a [chase](/programming/chases#the-timeline), the same fades play inside each item: the fade in
from the item's start, the fade out up to its end.

<LivePreview preset="scene-curve" />

| Setting | Description |
| --- | --- |
| **Bars** | How long the fade lasts, 0 to 64 bars. 0 means no fade: the values change at once |
| **Type** | A preset curve, each shown with a small picture of its shape: **Linear**, **Ease**, **Ease in**, **Ease out**, **Ease in-out**, then **Sine**, **Quad**, **Cubic**, **Quart**, **Quint**, **Expo**, **Circ** and **Back**, each **in**, **out** and **in-out**. With the list open, type a letter to jump to the presets starting with it. **Custom** is a curve you shaped yourself |
| **CP1 X/Y**, **CP2 X/Y** | The curve's two control points. **X** (time) goes from 0 to 1; **Y** from −1 to 2. **CP1** shapes the start of the fade, **CP2** its end |

The scene plays the curve as drawn: halfway through the fade, the channels are where the
curve is halfway across. **In** curves start slowly, **out** curves arrive slowly, **in-out** do
both; **Sine** is the gentlest and **Expo** the sharpest.

**Back** curves overshoot: they go past the scene's values (or below the start) before settling.
The dotted lines mark the start and end levels, with room above and below for overshoot. A channel
never goes beyond its DMX range (0–255), so an overshoot at full level holds at 255.

Drag the points on the curve or type their values; changing them sets the type to **Custom**. The
curve is a cubic Bézier curve, like CSS easing: [cubic-bezier.com](https://cubic-bezier.com/)
shows how the points shape it.
