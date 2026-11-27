# Patching Fixtures

Patching tells Studio which lights you have and where they listen: each fixture gets a DMX
**universe**, a first **address** and a **mode**, plus a position on stage for the visualizer. You
patch, try and adjust fixtures in the **universe view**, which opens at the bottom of the screen
when you pick a universe in the [patch bay](/getting-started/interface#patch-bay). From left to
right: the universe's settings and its **Output** ([where it is sent](/rig/outputs#_3-route-a-universe)), its **Fixture Pool**, then the selected fixture's
settings, position and controls, each explained below.

A new show comes with four universes (**Universe 0** to **Universe 3**). Each holds 512 DMX
channels. Add more with the patch bay's **New** ([Adding a universe](#adding-a-universe)).

Before you start, have your rig's paperwork at hand: for each light, its model, the DMX mode set
on its menu, its start address and the universe (the cable or node) it hangs on. Patching is
copying that into Studio. If Studio and the lights disagree on a mode or an address, the lights
react to the wrong channels: a dimmer fader moves the pan, a colour comes out wrong.

**In the demo show:** universe *Stage* holds four *MAC Aura* in *Standard* mode (14 channels) at
addresses 1, 15, 29 and 43, so 56 addresses in use and 456 free.

## Patching a Fixture

1. In the patch bay, unfold the universe you want to patch into.
2. In the **Fixture Pool** widget, press **Add**. The **Patch Fixture** popup opens.
3. Pick a fixture in the list on the left. Type in **Search items** to filter it.
4. Choose its **Fixture mode**. The mode sets how many channels the fixture uses.
5. Check the **Address** (Studio proposes the first free one) and, to patch several identical
   fixtures one after another, the **Amount**.
6. Press **OK**. The fixtures appear in the fixture pool, in the patch bay and in the visualizer,
   in a line 1 m apart, centred left to right. They are hung 4 m up on the first row that is
   still free (3 m in front of the stage's centre, then over it, behind it, further out); smoke
   machines, hazers and fans stand on the floor at the back instead. Adjust them with the
   **Position Tool** ([below](#fixture-settings-and-position)).

The preview adds a *Generic PAR RGBW* to the demo rig: it takes the first free address, 57, and
is hung 4 m up, 3 m in front of the heads.

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
| **Address** | First address, 1 to 512, as your DMX equipment counts. The fixture uses the addresses from there on. The map below shows the new fixtures as faint ghost blocks where they would go, red when the range is taken or runs past 512 |
| **Amount** | How many fixtures to patch, one after another. Several are numbered after their name: *Spot 1*, *Spot 2*… |
| **Stop** | The last address the fixtures use (read only) |

When the range can't be patched, a message under the map says why: the fixtures already holding
those addresses, the range running past 512, or no free range that large in the universe.

### Importing GDTF fixtures

For a fixture that isn't in the list, import its `.gdtf` file with **Import GDTF…** under the
list: see [GDTF fixtures](/rig/fixtures#gdtf-fixtures). A show that uses GDTF fixtures this device
doesn't have opens with a **Missing fixtures** prompt first: see
[Opening a show with missing fixtures](/rig/fixtures#opening-a-show-with-missing-fixtures).

## Selecting and Filtering Fixtures

Click a fixture in the **Fixture Pool** (or the patch bay) to select it: the universe view shows its
settings and controls, and the visualizer outlines it, so you can tell which light on stage is
which. The fixture pool widens to show long names whole, up to a limit; past it, hover a name to
read it. Hold <kbd>Ctrl</kbd> and click to select several. Type in **Search items** to show only the
fixtures whose name matches. The universe keeps its selection while you work elsewhere: open it
again and the same fixtures are selected.

<LivePreview preset="patch-bay-select" />

Filtering matches any part of the name: `Aura 3` finds *MAC Aura 3*, `Aura` all four. Name your
fixtures by position (*Front PAR L*, *Back wash 2*) and the filter becomes the fastest way around a
big rig.

<LivePreview preset="patch-bay-filter" />

## Adding a Universe

In the patch bay, press **New**. The **New Media** popup asks what to add: **DMX Universe** is the
only type in this release. Give it a **Name** and a **Color**, then press **OK**: the universe
appears in the patch bay with the next free number, ready to patch into.

<LivePreview preset="patch-bay-new" />

## Deleting Fixtures

In the universe view's **Fixture Pool**, or in the patch bay, select the fixtures, then press
<kbd>Delete</kbd> or <kbd>Backspace</kbd> and confirm. A deleted fixture is also removed from every group, scene and
effect that used it, and its addresses become free. In the preview, *MAC Aura 4* leaves the show,
and the rig on stage loses its right-hand head.

<LivePreview preset="fixture-pool-delete" />

## Universe Settings

<LivePreview preset="universe-settings" />

| Setting | Description |
| --- | --- |
| **Name** | The universe's name |
| **ID** | The universe's number, given when it is created and fixed from then on (shown greyed out). Its output sends to this universe number |
| **Color** | The universe's colour in the patch bay |

## Fixture Settings and Position

The **Fixture Settings** widget renames the selected fixture and changes its **Mode**. The **Model**
is shown for reference; next to them, **Ch Start**, **Ch Stop** and **Ch Count** give the addresses it
uses. To move it, press **Edit** in the widget's header ([Repatching](#repatching)).

<LivePreview preset="fixture-settings" />

When you change a fixture's mode, channels found in both modes (for example **Dimmer** or **Pan**)
keep their value and new channels start at 0. If the new mode needs more addresses than are free
after the fixture, or goes past the end of the universe, the change is refused and the fixture keeps
its mode.

### Repatching

**Edit** opens the **Repatch** popup: a map of a universe's 512 addresses, 32 per row, each
fixture a block over the addresses it uses, with its name and its first and last address. The
selected fixtures are outlined on the map and highlighted in the visualizer.

- **Drag** a block to move the fixture. Click to select one, <kbd>Ctrl</kbd>/<kbd>⌘</kbd> or
  <kbd>Shift</kbd>-click to select several, and drag them together. A block never lands on
  another fixture (it stays where it last fitted) and stops at address 1 and 512; click an empty
  address to clear the selection.
- **Selection** picks a fixture of the universe shown from a list.
- **Move to free range** puts the selected fixtures, back to back, at the first free addresses of
  the universe shown. Pick another **Universe** first to move them there; their groups, scenes
  and effects keep them.
- **Remove gaps** slides the universe's fixtures down to address 1, in their order, closing the
  gaps between them.
- **Reset** puts every fixture back where it is patched.

The side of the popup lists the **Changes**, each fixture's addresses before and after (click one
to select it); a fixture moving to another universe gets a warning below. Nothing moves until you
press **OK**; **Cancel** keeps every address.

### Position Tool

The **Position Tool** places the selected fixtures on stage for the visualizer. You can also drag
them in the [visualizer](/interface/visualizer/).

- **The stage map**, on the left, shows the stage from above: the back at the top, the audience
  at the bottom, a dot per fixture of the universe (fixtures of other universes are faint). A
  short line shows where a beam points when it isn't straight up or down. Click a dot to select
  its fixture (<kbd>Ctrl</kbd>/<kbd>⌘</kbd> or <kbd>Shift</kbd> to add or remove one), and drag
  it to move the whole selection on a 0.25 m grid; hold <kbd>Alt</kbd> to drag freely.
- **X**, **Y** and **Height** give the position in meters, to the centimetre. **X** runs left (−)
  to right (+) as the audience sees it, **Y** from the audience (−) to the back of the stage (+),
  **Height** up from the floor.
- **Mount** says how the fixture hangs: on the **floor** (beam up), **hung** from a truss (beam
  down), on the **left** or **right wall**, on the **back wall** (beam toward the audience) or at
  the **front** (beam toward the back). **Turn** spins it on its base and **Tilt** leans its beam,
  in degrees. Changing the mount keeps the turn and the tilt.

With several fixtures selected (the header shows how many), a field shows their value when they
share it and **--** when they differ; a mount is lit only when they all share it. Typing a value
sets it on all of them; the arrows move each one a step from where it is, so a row keeps its
spacing.

**Arrange** (in the header, or <kbd>A</kbd>) places the whole selection at once, in the fixture
pool's order. Pick a mode on the left (type in **Search items** to find one) and set it on the
right; a value you type applies when you press <kbd>Enter</kbd> or leave the field.

| Mode | Places the fixtures |
|---|---|
| **Line** | Evenly along X, Y or Z, at a spacing, around a centre |
| **Grid** | In rows of a number of columns on the floor, around a centre |
| **Circle** | Evenly on a circle, on the floor or upright facing the audience; they can face its centre or away from it |
| **Arc** | As Circle, from a start to an end angle (0° to the right, turning towards the back) |
| **Align** | All at the lowest, middle or highest value of the selection on one axis |
| **Distribute** | Even gaps between the two outermost fixtures on one axis |
| **Fan** | Rotations spread from −angle to +angle about one axis |
| **Aim** | Each fixture turned to point its beam at one point |

The fixtures move in the visualizer as you change the settings. **Apply** keeps the result and
leaves the popup open, so you can combine modes: a **Line**, **Apply**, then **Aim** them all at
one point. **OK** keeps the result and closes; **Cancel** puts every fixture back where it was
when you opened the popup or last pressed **Apply**.

The demo heads hang at Y 0, height 6: on a truss 6 m up, across the middle of the stage. Change
*MAC Aura 1*'s **Height** below, or drag its dot, and watch it move.

<LivePreview preset="fixture-position" />

## Trying a Fixture

The universe view controls the selected fixtures directly, so you can check they respond: what you
set goes into the [programmer](/programming/playback#the-programmer), above every cue, and is
**not saved**. To keep a look, make a [scene](/programming/scenes).

With several fixtures selected, every control sets all of them: a channel goes to the same kind of
channel on each fixture that has one (fixtures without it are left alone), the colour picker mixes
the colour on each fixture's own colour channels, and pan/tilt aims each moving head at the same
angle when its range is known (else the same values). The widgets show the first selected
fixture.

This is the first thing to do after patching real lights: bring each one's dimmer up, move its
pan and tilt, and check the right light answers the right way. In the previews below, the
controls drive *MAC Aura 2* on the demo rig.

### Channels

One fader per channel, with its value (DMX 0–255) above it. Type a value or drag the fader.

Under each value is the channel's box: an icon for its function (a half-filled circle for a dimmer,
**R**, **G**, **B**, **W**, **A** (amber) or **UV** for a colour, a thermometer for colour
temperature, a lightning bolt for a strobe…) and either what the current value does (*Closed*,
*Strobe fast → slow*, *Gobo 3*) or, on a channel with a single range, its name. Hover it to read
the full name and range.

Click the box to see the channel's full name and its ranges: each shows its values and what it
does, and the one holding the current value is highlighted. Pick one to set the channel to the
start of that range, or use <kbd>↑</kbd> <kbd>↓</kbd> and <kbd>Enter</kbd>; <kbd>Esc</kbd> closes
the list without a change. Type in the list's search field to keep only the matching ranges.
Range names come from the fixture's definition. At the top of the list, **Park at …** (the current value) locks
the channel ([Parking a channel](/programming/playback#parking-a-channel)), and **Clear** gives a
channel you set back to playback.

The box and the fader are coloured by what drives the channel: violet for your own values, blue for
a cue, red for a parked channel. **Clear programmer** and **Unpark** in the widget's header act on
the selected fixtures ([The programmer](/programming/playback#the-programmer)).

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
