# Effects

An effect moves channels over time: a dimmer pulse, a colour cycle, heads drawing a circle. Each
**modulated channel** follows a waveform between a minimum and a maximum, and the waveform can be
offset from fixture to fixture (or pixel to pixel) so the movement travels across the rig.

Create an effect like any cue: double click an empty slot of the group's **Cue Pool** and choose
**effect** (see [Creating a cue](/programming/scenes#creating-a-cue)). Effects loop by default.
Selecting an effect shows its widgets in the group view.

<LivePreview preset="effect-modifier" />

## Modulated Channels

Lists the channels this effect moves. Click one to edit it in the **Effect Tool**.

<LivePreview preset="effect-channels" />

Press **Add** to add a channel. The **Add Modulated Channel** popup lists the kinds of channels an
effect can move: unfold one, pick a preset and press **OK**.

| Kind | Presets |
| --- | --- |
| Zoom | zoom |
| Dimmer | dimmer |
| Pan & tilt | Line, Circle, Eight, Pan, Tilt |
| Color | Hue shift, color intensity red, green and blue |

A preset adds its channels with their settings, or applies them to the channels the effect already
has. To remove a channel, select it, press <kbd>Delete</kbd> or <kbd>Backspace</kbd> and
confirm.

<LivePreview preset="effect-channel-add" />

## Channel Fixtures Activity

Every fixture of the group takes part in each modulated channel by default. Untick a fixture to
leave it out of the selected channel, or use **Check All**. Drag fixtures to change their order:
the order is the one the movement travels in.

## Effect Tool

Shapes the selected channel's movement. The graph shows the waveform and where each fixture sits
on it.

<LivePreview preset="effect-wave" />

| Setting | Description |
| --- | --- |
| **Waveform** | The shape: **SINE** (smooth), **TRIANGLE** (straight up and down), **SQUARE** (jumps between min and max) |
| **Min**, **Max** | The channel's lowest and highest value (DMX 0–255) |
| **Freq** | How many times the waveform repeats over the effect's **Duration** (1–100). At 1, a 2-bar effect does one cycle every 2 bars |
| **Phase** | Shifts the whole waveform, in degrees |
| **Direction** | How the offset runs across fixtures: **LTR** first to last, **RTL** last to first, **SYM** from both ends to the middle |
| **Spread over** | **Fixtures**: one offset per fixture, a fixture's cells move together. **Cells**: one offset per cell (fixture order, then cell order), so the movement runs along a pixel bar |
| **Phase start**, **Phase stop** | The offset of the first and of the last fixture (or cell), −360° to 360°. Those in between are spread evenly |

With **Phase start** 0 and **Phase stop** 360, the fixtures are spread over one whole cycle: a
"wave" running through the rig. With both at 0, every fixture moves together.

> **Note:** An effect moves its channel in every cell of a fixture (each pixel's dimmer, each head's
> pan).

> **Note:** In this release, the **PWM** waveform keeps the channel at its lowest, and the
> **BOUNCELRT** and **BOUNCERTL** directions don't spread the fixtures (they all move together).
> Use the other waveforms and directions.

## Timing

An effect's speed comes from its **Duration** in bars (in **Cue Settings**) and its **Freq**, so it
follows the show's tempo: double the BPM and the effect runs twice as fast. See
[Timing and playback](/concepts/timing).
