# Patching Fixtures

Patching places fixtures on a universe's DMX addresses. Open the patch popup with the **Add** button of a universe's [fixture pool](/modifiers/universe/#fixture-pool), pick a fixture, set its mode and address, then press **OK**.

<LivePreview preset="patch-add" />

## Choosing a Fixture

The list on the left of the patch popup holds every fixture you can patch:

| Section | Description |
| --- | --- |
| **Imported (GDTF)** | GDTF fixtures you imported on this device |
| **Bundled (GDTF)** | Generic GDTF fixtures that ship with Studio: a PAR, a spot, a wash, a pixel bar and a multi-beam bar |
| Manufacturer folders | The built-in [Open Fixture Library](https://open-fixture-library.org/) fixtures, by manufacturer |

Type in **Search Items** to filter the list. Fixtures of every type can be patched: moving heads, PARs, washes, bars, pixel and multi-cell fixtures.

## Importing GDTF Fixtures

GDTF is the standard file format manufacturers use to describe their fixtures. To use a fixture that isn't in the list, get its `.gdtf` file (from the manufacturer's website or [GDTF Share](https://gdtf-share.com/)), then either:

- press **Import GDTF…** under the fixture list and pick one or more `.gdtf` files, or
- drop the `.gdtf` files on the fixture list.

Imported fixtures appear under **Imported (GDTF)** and stay available in every show on this device. Importing a newer revision of a fixture you already have replaces it.

> **Note:** Imported fixtures are kept in this browser's storage (or the desktop app's). Clearing the site data removes them, so keep your `.gdtf` files. A file that is not a GDTF fixture, or is damaged, is refused with a message.

## Patch Settings

| Setting | Description |
| --- | --- |
| Name | The fixture's nickname |
| Fixture mode | The fixture's DMX mode; it sets how many channels the fixture uses |
| Address | First DMX address (Studio picks the first free one) |
| Amount | Number of fixtures to patch one after another |
| Stop | Last address used |
| Pos X/Y/Z, °Rot X/Y/Z | Position (meters) and rotation (degrees) of the first fixture |
| Offset X/Y/Z, °Offset X/Y/Z | Added to the position and rotation of each next fixture |

A rotation of 180° on X hangs the fixture with its beam pointing down.

## Opening a Show with Missing Fixtures

Shows don't contain the GDTF files themselves: they refer to the fixtures in your library. When you open a show that uses a GDTF fixture that isn't on this device (for example a show made on another computer), Studio lists the missing fixtures before opening it:

- import their `.gdtf` files with **Import GDTF…** or by dropping them on the popup, then press **Open**, or
- press **Open anyway**. The missing fixtures keep their addresses, groups and scene values in the show but stay dark. Import them later and reopen the saved show to bring them back.

<!-- TODO media: Missing fixtures popup -->

## Fixtures with Pixels

Pixel bars, panels and multi-cell fixtures have one set of channels per cell (for example **Red 3** for the third pixel), so each cell can take its own colour in scenes and effects.

> **Note:** Some Open Fixture Library moving heads with pixel channels (for example the Robe Robin LEDWash 600) used to be patched with too few channels. Opening a show that has one shows a message naming it: its channel count is now the real one, so check its address and that it doesn't overlap the next fixture.
