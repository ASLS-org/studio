# Patching Fixtures

Patching tells Studio which lights you have and where they listen: each fixture gets a DMX
**universe**, a first **address** and a **mode**, plus a position on stage for the visualizer. You
patch, try and adjust fixtures in the **universe view**, which opens at the bottom of the screen
when you pick a universe in the [patch bay](/getting-started/interface#patch-bay).

<LivePreview preset="universe-modifier" />

A new show comes with four universes (**Universe 0** to **Universe 3**). Each holds 512 DMX
channels.

## Patching a Fixture

1. In the patch bay, unfold the universe you want to patch into.
2. In the **Fixture Pool** widget, press **Add**. The **Patch Fixture** popup opens.
3. Pick a fixture in the list on the left. Type in **Search items** to filter it.
4. Choose its **Fixture mode**. The mode sets how many channels the fixture uses.
5. Check the **Address** (Studio proposes the first free one) and, to patch several identical
   fixtures one after another, the **Amount**.
6. Press **OK**. The fixtures appear in the fixture pool, in the patch bay and in the visualizer.

<LivePreview preset="patch-add" />

### The fixture list

| Section | What it holds |
| --- | --- |
| **Imported (GDTF)** | GDTF fixtures you imported on this device |
| **Bundled (GDTF)** | Generic GDTF fixtures that ship with Studio: a PAR, a spot, a wash, a pixel bar and a multi-beam bar |
| Manufacturer folders | The built-in [Open Fixture Library](https://open-fixture-library.org/) fixtures, by manufacturer |

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

GDTF is the file format manufacturers use to describe their fixtures. For a fixture that isn't in
the list, get its `.gdtf` file (from the manufacturer or [GDTF Share](https://gdtf-share.com/)),
then press **Import GDTF…** under the fixture list, or drop the files on the list. Imported
fixtures appear under **Imported (GDTF)** in every show on this device.

> **Note:** Imported fixtures are kept in this browser's storage (or the desktop app's). Clearing
> the site data removes them, so keep your `.gdtf` files.

### Opening a show with missing fixtures

A show refers to the fixtures in your library; it doesn't contain GDTF files. When you open a show
that uses a GDTF fixture this device doesn't have, Studio lists the missing fixtures first:
import their files and press **Open**, or press **Open anyway** (the missing fixtures keep their
addresses, groups and scene values but stay dark until you import them and reopen the show).

## Selecting and Filtering Fixtures

Click a fixture in the **Fixture Pool** (or the patch bay) to select it: the universe view shows its
settings and controls. Hold <kbd>Ctrl</kbd> and click to select several. Type in **Search items**
to show only the fixtures whose name matches.

<LivePreview preset="patch-bay-select" />

<LivePreview preset="patch-bay-filter" />

## Deleting Fixtures

Select the fixtures, then press <kbd>Delete</kbd> or <kbd>Backspace</kbd> and confirm. A deleted
fixture is also removed from every group, scene and effect that used it.

<LivePreview preset="fixture-pool-delete" />

## Universe Settings

<LivePreview preset="universe-settings" />

| Setting | Description |
| --- | --- |
| **Name** | The universe's name |
| **ID** | The universe's number |
| **Output** | The connection this universe is sent through, set with **Config**. See [Toolbar](/interface/toolbar/) for outputs |
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

<LivePreview preset="fixture-position" />

## Trying a Fixture

The universe view controls the selected fixture directly, so you can check it responds: these
values go out live but are **not saved**. To keep a look, make a [scene](/programming/scenes).

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
master dimmer, a strobe). Fixtures without cells don't show the widget.

<LivePreview preset="fixture-cells" />

## Supported Channel Types

Every channel is sent to your lights. The visualizer draws the ones marked ✅.

| Channel type | Visualizer | Notes |
| --- | :---: | --- |
| Intensity (dimmer) | ✅ | |
| Shutter / strobe, strobe speed and duration | ✅ | |
| Color intensity | ✅ | Red, green, blue, cyan, magenta, yellow, white, warm and cold white, amber, UV, lime |
| Color preset, color temperature | ✅ | |
| Pan, tilt | ✅ | Continuous pan and tilt, and pan/tilt speed: ⬜️ |
| Wheel slot | ✅ | Colour, gobo and prism wheels |
| Wheel slot rotation | ✅ | Gobo rotation and gobo index |
| Beam angle, beam position, zoom, focus, iris, frost | ✅ | |
| Prism, prism rotation | ✅ | The fixture's facets (GDTF), else three |
| Rotation, speed, time | ✅ | |
| Built-in effects, wheel shake and rotation, blades, fog, sound, maintenance | ⬜️ | Sent, not drawn |
