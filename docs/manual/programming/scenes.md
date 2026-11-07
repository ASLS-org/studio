# Scenes

A scene is a look: values for some of a group's channels (a colour, a position, a dimmer level),
reached with a fade when you play it. Scenes and [effects](/programming/effects) are the group's
**cues**, kept in its **Cue Pool**.

## Creating a Cue

1. Open the group (click it in the group pool).
2. In the **Cue Pool**, double click an empty slot. The **Add Cue** popup opens.
3. Choose the **Cue type** (**scene** or **effect**), a **Color** and a **Name**, and press **OK**.

A cue's type can't be changed later; its name and colour can, in **Cue Settings**.

<LivePreview preset="cuepool-add" />

## The Cue Pool

Each cell is a cue: its icon shows its type, its colour comes from the cue.

- Click a cue's **body** (the icon) to play or stop it. A playing cue shows its progress.
- Click a cue's **footer** (its name) to select it for editing without playing it.
- Drag a cue to an empty slot to move it.
- Select a cue and press <kbd>Delete</kbd> or <kbd>Backspace</kbd> to delete it, from every chase
  too.

The strip on the right of the pool is an overview of every slot: playing cues blink there, so you
can spot them without scrolling.

<LivePreview preset="group-cuepool" />

## Cue Settings

<LivePreview preset="cue-settings" />

| Setting | Description |
| --- | --- |
| **Name** | The cue's name |
| **Color** | The cue's colour in the cue pool and in chases |
| **Loop Style** | **One Shot** plays the cue once; **Loop** repeats it until you stop it |
| **Trigger Style** | Saved with the cue; see the note below |
| **Start** | **Absolute**: a scene fades from 0. **Relative**: it fades from the channels' current values, so it blends from whatever was on stage |
| **Duration** | How long the cue lasts, in bars (see [Timing and playback](/concepts/timing)). For a scene, this is its fade time |

> **Note:** **Trigger Style** has no effect yet: every cue starts and stops on a click, as
> **Toggle** describes. **Temporary** (playing only while held) isn't available in this release.

> **Note:** A scene that has played to its end stays on stage: it stops, but its values remain on
> the fixtures until something else changes them.

## Setting a Scene's Values

When a scene is selected, the group view shows the scene's widgets. Values you set here are the
scene's **end values**: where the fixtures arrive when the scene has faded in.

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
> first cue (the top-left slot): set its fixtures one at a time.

Channel faders are labelled by position (**CH1**, **CH2**…) with an icon for their function (the
half-filled circle is a dimmer, **R**, **G**, **B** and **W** are colours).

### Cells

For fixtures with cells (pixel bars and matrices, multi-head fixtures), the **Cells** widget lists
them after **All cells**:

- **All cells** (the default): one fader per kind of channel (one **Dimmer**, one **Red**…) sets it
  in every cell.
- Click a cell to set it alone, or hold <kbd>Ctrl</kbd> to pick several.

Channels of the whole fixture (a master dimmer, a strobe) are always shown. The scene keeps each
cell's value, so one scene can give every pixel its own colour, as this bar's **Split** scene does.

<LivePreview preset="scene-modifier-bar" />

### Color Picker and Pan/Tilt

They work as in the universe view (see [Trying a fixture](/programming/patching#trying-a-fixture)),
on the scene's selected fixtures and cells.

## Fade In

The **Fade in** widget shapes how the scene moves from its start values to its end values over its
**Duration**: a curve from start (bottom left) to end (top right).

<LivePreview preset="scene-curve" />

| Setting | Description |
| --- | --- |
| **Type** | A preset curve: **LINEAR**, **EASE**, **EASE_IN**, **EASE_OUT**, **EASE_IN_OUT**, or **CUSTOM** |
| **CP1 X/Y**, **CP2 X/Y** | The curve's two control points (0 to 1). **CP1** shapes the start of the fade, **CP2** its end |

Drag the points on the curve or type their values; changing them sets the type to **CUSTOM**. The
curve is a cubic Bézier curve, like CSS easing: [cubic-bezier.com](https://cubic-bezier.com/)
shows how the points shape it.
