# Patching Fixtures

Patching tells Studio which lights you have and where they listen: each fixture gets a DMX
**universe**, a first **address** and a **mode**, plus a position on stage for the visualizer. You
patch, try and adjust fixtures in the **universe view**, which opens at the bottom of the screen
when you click a universe in the [patch bay](/getting-started/interface#patch-bay). From left to
right: the universe's settings and **Stream**, its **Fixture Pool**, then the selected fixture's
settings, position and controls, each explained below.

A new show comes with four universes (**Universe 0** to **Universe 3**). Each holds 512 DMX
channels. Add or remove universes in the patch bay: see [Universes](#universes).

Before you start, have your rig's paperwork at hand: for each light, its model, the DMX mode set
on its menu, its start address and the universe (the cable or node) it hangs on. Patching is
copying that into Studio. If Studio and the lights disagree on a mode or an address, the lights
react to the wrong channels: a dimmer fader moves the pan, a colour comes out wrong.

**In the demo show:** universe *Stage* holds four *MAC Aura* in *Standard* mode (14 channels) at
addresses 0, 14, 28 and 42, so 56 addresses in use and 456 free.

## Patching a Fixture

1. In the patch bay, click the universe you want to patch into.
2. In the **Fixture Pool** widget, press **Add**. The **Patch Fixture** popup opens.
3. Pick a fixture in the list on the left. Type in **Search items** to filter it.
4. Choose its **Fixture mode**. The mode sets how many channels the fixture uses.
5. Check the **Address** (Studio proposes the first free one) and, to patch several identical
   fixtures one after another, the **Amount**.
6. Press **OK**. The fixtures appear in the fixture pool and in the visualizer, and the patch
   bay counts them.

The preview adds a *Generic PAR RGBW* to the demo rig: it takes the first free address, 56, and
hangs 4 m up, 3 m in front of the heads (**Pos Y** −3, **Pos Z** 4, **°Rot X** 180).

<LivePreview preset="patch-add" />

### The fixture list

The list holds the built-in Open Fixture Library, the generic fixtures bundled with Studio, and
the GDTF fixtures you imported. Where they come from, how to find one and how to import a GDTF
file: [Fixture Library](/rig/fixtures).

### Patch settings

| Setting | Description |
| --- | --- |
| **Name** | The fixture's name in lists |
| **Fixture mode** | The fixture's DMX mode: it sets the channels it uses |
| **Address** | First address, 0 to 511. The fixture uses the addresses from there on |
| **Amount** | How many fixtures to patch, one after another |
| **Stop** | The last address the fixtures use (read only) |
| **Pos X/Y/Z**, **°Rot X/Y/Z** | Position (meters) and rotation (degrees) of the first fixture |
| **Offset X/Y/Z**, **°Offset X/Y/Z** | Added to the position and rotation of each next fixture, to lay out a row |

A fixture is placed with Z up: a rotation of 180° on X hangs it with its beam pointing down.

> **Note:** Studio counts addresses from 0, as its lists show (`U0 - CH14` is universe 0, address
> 14). Address 0 is the channel your DMX equipment calls 1, so a fixture set to address 1 on its
> display goes at address 0 in Studio.

### Importing GDTF fixtures

For a fixture that isn't in the list, import its `.gdtf` file with **Import GDTF…** under the
list: see [GDTF fixtures](/rig/fixtures#gdtf-fixtures). A show that uses GDTF fixtures this device
doesn't have opens with a **Missing fixtures** prompt first: see
[Opening a show with missing fixtures](/rig/fixtures#opening-a-show-with-missing-fixtures).

## Selecting and Filtering Fixtures

Click a fixture in the **Fixture Pool** to select it: the universe view shows its
settings and controls, and the visualizer outlines it, so you can tell which light on stage is
which. Hold <kbd>Ctrl</kbd> and click to select several. Type in **Search items** to show only the
fixtures whose name matches.

<LivePreview preset="fixture-pool-select" />

Filtering matches any part of the name: `Aura 3` finds *MAC Aura 3*, `Aura` all four. Name your
fixtures by position (*Front PAR L*, *Back wash 2*) and the filter becomes the fastest way around a
big rig.

<LivePreview preset="fixture-pool-filter" />

## Deleting Fixtures

In the universe view's **Fixture Pool**, select the fixtures, then press <kbd>Delete</kbd> or
<kbd>Backspace</kbd> and confirm. A deleted fixture is also removed from every group, scene and
effect that used it, and its addresses become free. In the preview, *MAC Aura 4* leaves the show,
and the rig on stage loses its right-hand head.

<LivePreview preset="fixture-pool-delete" />

## Universes

The patch bay lists the show's universes. **New** adds an empty one, numbered after the highest
(*Universe 4* in a new show), and opens it. To remove universes, select them in the patch bay,
press <kbd>Delete</kbd> or <kbd>Backspace</kbd> and confirm: every fixture patched on them goes
too, from every group, scene and effect. The confirmation lists how many fixtures each universe
holds. In the preview, a new universe is added, then deleted.

<LivePreview preset="patch-bay-universes" />

## Universe Settings

<LivePreview preset="universe-settings" />

| Setting | Description |
| --- | --- |
| **Name** | The universe's name |
| **ID** | The universe's number |
| **Output** | The connection this universe is sent through: see [Outputs](/rig/outputs#_3-send-a-universe) |
| **Color** | The universe's colour in the patch bay |

## Fixture Settings and Position

The **Fixture Settings** widget renames the selected fixture, moves its **Address** and changes
its **Mode**. The **Model** is shown for reference.

<LivePreview preset="fixture-settings" />

When you change a fixture's mode, channels found in both modes (for example **Dimmer** or **Pan**)
keep their value and new channels start at 0. If the new mode needs more addresses than are free
after the fixture, or goes past the end of the universe, the change is refused and the fixture keeps
its mode.

The **Position Tool** places the fixture on stage for the visualizer: **Position X/Y/Z** in meters
(to the centimetre) and **Rotation X/Y/Z** in degrees. You can also drag fixtures in the
[visualizer](/interface/visualizer/).

Stage axes: **X** runs left to right as the audience sees it, **Y** from the audience (negative)
to the back of the stage (positive), **Z** up from the floor. The demo heads sit at Y 0, Z 6: on a
truss 6 m up, across the middle of the stage. Change *MAC Aura 1*'s **Position Z** below and watch
it move.

<LivePreview preset="fixture-position" />

## Trying a Fixture

The universe view controls the selected fixture directly, so you can check it responds: these
values go out live but are **not saved**. To keep a look, make a [scene](/programming/scenes).

This is the first thing to do after patching real lights: bring each one's dimmer up, move its
pan and tilt, and check the right light answers the right way. In the previews below, the
controls drive *MAC Aura 2* on the demo rig.

### Channels

One fader per channel, with its value (DMX 0–255) above it. Type a value or drag the fader.

<LivePreview preset="fixture-channels" />

### Color Picker

Sets the fixture's colour channels whatever its colour system (RGB, RGBW, CMY…). Pick a hue on the
wheel and its saturation and brightness in the square, or type values in the fields on the right:
the **Mode** list switches them between HSV, RGB and CMY. **Hex code** shows the colour (press
**Copy** to copy it). On a fixture with a white channel, white takes the part red, green and blue share
(red 255, green 128, blue 128 gives white 128 and red 127). Amber, UV and lime stay on their
faders.

<LivePreview preset="fixture-color" />

### Pan/Tilt

Drag the point to aim a moving head. **Set fine channels** also moves the fine pan and tilt
channels, for 256 steps between two coarse values, on fixtures that have them.

<LivePreview preset="fixture-pantilt" />

### Cells

Some fixtures are made of cells: the pixels of a bar or a matrix, the heads of a multi-head
fixture. For these, the **Cells** widget lists them after **All cells**:

- **All cells** (the default): the controls set every cell at once.
- Click a cell to control it alone, or hold <kbd>Ctrl</kbd> to pick several.

The channels widget then shows the selected cells' channels plus those of the whole fixture (a
master dimmer, a strobe). Fixtures without cells, such as the demo rig's heads, don't show the
widget. [Cells](/rig/fixtures#cells) shows them on a 12-pixel bar.

## Supported Channel Types

Every channel is sent to your lights; which ones the visualizer draws is listed in
[Fixture Library](/rig/fixtures#supported-channel-types).
