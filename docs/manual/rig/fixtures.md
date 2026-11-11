# Fixture Library

Studio needs to know what each of your lights is: which channels it has, in which order, and what
they do. That description is the fixture's **profile**. Studio finds profiles in three places, all
listed in the **Patch Fixture** popup when you press **Add** in a universe's fixture pool (see
[Patching fixtures](/programming/patching#patching-a-fixture)):

| Section | What it holds | Where it comes from |
| --- | --- | --- |
| **Imported (GDTF)** | GDTF fixtures you imported on this device | Files you import (below) |
| **Bundled (GDTF)** | Generic fixtures that ship with Studio: a PAR (RGBW), a spot, a wash (RGBW), a 12-pixel bar and a multi-beam bar | Made by the ASLS project, free to use |
| Manufacturer folders | 480 fixtures from 117 manufacturers | The [Open Fixture Library](https://open-fixture-library.org/), built in |

In the demo show, the four heads are *Martin MAC Aura* from the Open Fixture Library; the patching
demo adds a *Generic PAR RGBW* from **Bundled (GDTF)** ([Patching a fixture](/programming/patching#patching-a-fixture)).

## Finding a Fixture

Type in **Search items** above the list to filter it. Open Fixture Library fixtures are listed
by their library names, in lower case: a folder per manufacturer (`martin`) holding a file per
model (`mac-aura.json`), so search for a part of the model's name, such as `aura`, rather than its
full commercial name. Unfold a folder to see its fixtures. When you pick one, the popup shows its
**Fixture mode** list: the DMX modes the fixture offers.

Pick the mode your light is set to on its own menu or DIP switches. The mode decides how many
channels the fixture takes and what each one does; a wrong mode makes faders move the wrong
things (the pan on the dimmer fader, colours out of order).

> **Tip:** If your exact model isn't listed, look for a sibling model of the same manufacturer
> with the same mode (same channel count and order, written in the light's manual), or use a
> bundled generic fixture with the same channels. Otherwise import its GDTF file.

## GDTF Fixtures

GDTF is the file format manufacturers use to describe their fixtures, including their 3D models
and gobo images. For a fixture that isn't in the list:

1. Get its `.gdtf` file: from the manufacturer's website, or from
   [GDTF Share](https://gdtf-share.com/), the shared library most manufacturers publish to.
2. In the **Patch Fixture** popup, press **Import GDTF…** under the fixture list and pick the
   files, or drop them on the list.
3. They appear under **Imported (GDTF)**, in every show on this device.

GDTF fixtures are drawn in the visualizer from their own description: each beam, cell and moving
part sits where the file puts it, gobos project the file's images, and the manufacturer's 3D
models replace Studio's generated parts when the file has them.

> **Note:** Imported fixtures are kept in this browser's storage (the desktop app has its own).
> Clearing the site's data, or using a private window, removes them. Keep your `.gdtf` files.

If a file can't be imported, the popup says why:

| Message | What it means |
| --- | --- |
| The file is not a GDTF fixture or is damaged (not a readable zip archive) | It isn't a `.gdtf` file, or the download is incomplete |
| The file is not a GDTF fixture (no description.xml) / (no GDTF element) | A zip file, but not a GDTF fixture |
| The GDTF description is damaged (description.xml is not valid XML) | The file is broken: download it again |
| The GDTF description has no fixture type | An empty or unfinished description |
| The GDTF fixture has no DMX mode with DMX channels | The fixture can't be controlled over DMX |

## Opening a Show With Missing Fixtures

A showfile names the fixtures it uses; it doesn't contain their GDTF files. When you open a show
that uses GDTF fixtures this device hasn't imported (a show from another computer, or after
clearing the browser's data), Studio shows **Missing fixtures** first, with each one ticked once
found:

- Import their files with **Import GDTF…** (or drop them on the popup), then press **Open**.
- Or press **Open anyway**: the missing fixtures keep their addresses, groups and scene values,
  but they stay dark and send nothing until you import their files and open the show again.

Open Fixture Library and bundled fixtures are never missing: they're part of Studio.

## Fixtures in 3D

Every patched fixture shows in the [visualizer](/interface/visualizer/), placed by its
**Position** and **Rotation** (see [Fixture settings and position](/programming/patching#fixture-settings-and-position)):

- **Bodies** follow the fixture's parts: a base, yoke and head for moving heads, a can for PARs
  and profiles, a bar or a panel, each sized like the real fixture. GDTF files with their own 3D
  models show the manufacturer's parts instead; Open Fixture Library fixtures get parts built from
  their type and size.
- **Detail** follows the visualizer's quality: lower levels use simpler models so large rigs stay
  smooth.
- **Light** comes from the fixture's channels: dimmer, colour, zoom, gobos, prisms and more (see
  the table below). A fixture's brightness follows its light output, so a 20,000 lm spot outshines
  a 2,000 lm PAR at the same dimmer.

### Cells

Some fixtures repeat a set of channels: each pixel of a bar has its own red, green and blue; each
head of a multi-head fixture its own pan and tilt. Each repeat is a **cell**. Studio lights each
cell in its own colour, lets scenes give every cell its own values and lets effects travel from
cell to cell. Channels for the whole fixture (a master dimmer, a strobe) belong to no cell.

<CellsBar />

The universe view and scenes show a **Cells** widget for these fixtures: see
[Trying a fixture](/programming/patching#cells) and [Scenes](/programming/scenes#cells).

## Supported Channel Types

Every channel is sent to your lights, whatever its type. The visualizer draws the ones marked ✅.

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

> **Note:** If a fixture has several gobo wheels, only its first one is drawn.
