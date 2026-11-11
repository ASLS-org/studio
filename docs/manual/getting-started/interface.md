# The Interface

Studio's window has five regions. You pick something in one (a universe, a group, a chase) and
edit it in another, so knowing where things are is most of learning Studio. This page is the
map; each region's own page explains it in full.

| Region | Where | Use it to |
| --- | --- | --- |
| [Toolbar](#toolbar) | Top | Open and save shows, set preferences and outputs, run the clock |
| [Patch Bay](#patch-bay) | Left | Browse universes and their fixtures |
| [Group Pool](#group-pool) | Middle | See groups and their chases, start chases and master rows |
| [Visualizer](#visualizer) | Right | Watch the rig in 3D |
| [Modifier strip](#modifier-strip) | Bottom | Edit what you picked: a universe, a group and its cues, or a chase |

## Toolbar

The bar across the top: menus on the left, the show's name in the middle, the clock on the right.

<LivePreview preset="toolbar-menus" />

| Menu | Entries | Explained in |
| --- | --- | --- |
| **File** | **New Showfile**, **Load Showfile**, **Save Showfile Locally**, **Export Showfile** | [Showfiles](/rig/showfiles) |
| **Preferences** | **Visualizer** (its settings), **Outputs** (connections to your lights) | [Visualizer](/interface/visualizer/#settings), [Outputs](/rig/outputs) |
| **About** | **Manual** (this manual), **License** (GPL-3.0), **Credits**, **Contact** | |

Open a menu with a click; with one open, moving over another opens it. Each entry shows its
shortcut, which works without opening the menu ([Shortcuts](/reference/shortcuts)).

The **show's name** in the middle gets a `*` when it has changes you haven't saved
([Showfiles](/rig/showfiles#where-your-show-lives)). The **clock** on the right holds the
**BPM**, the play state and **Tap Tempo** ([Playing a show](/programming/playback#the-clock)).

## Patch Bay

Lists the universes, each unfolding to its fixtures with their address (`U0 - CH14`: universe 0,
address 14). Unfold a universe to open it in the modifier strip; click a fixture to select it
there and outline it in the visualizer. Type in **Search items** to find fixtures across
universes. More in [Patching fixtures](/programming/patching).

<LivePreview preset="patch-bay" />

## Group Pool

One column per group, with its chases in rows, and the **Master** column on the right. Click a
group's name to open it in the modifier strip; click a chase to open it; click a chase's play
button to start it. **New** creates a group. More in [Groups](/programming/groups),
[Chases](/programming/chases) and [Playing a show](/programming/playback).

<LivePreview preset="group-pool" />

## Visualizer

Your rig in 3D, driven by the same values that go to your lights. In this manual it's the
floating card at the bottom right of the page: it comes next to any preview that drives the rig,
like the patch bay and group pool above. Drag it by its title to move it, from its corner to
resize it, and reduce it to its title with **–**. More in [Visualizer](/interface/visualizer/).

## Modifier Strip

The bottom of the window shows the editing **view** for what you picked, as a row of widgets. When
they don't fit, scroll the strip sideways.

| You picked | The strip shows | Page |
| --- | --- | --- |
| A universe or a fixture | Universe settings and stream, its fixture pool, the fixture's settings, position and controls | [Patching fixtures](/programming/patching) |
| A group | Group settings, its fixture pool, its cue pool, and the selected cue's widgets | [Groups](/programming/groups), [Scenes](/programming/scenes), [Effects](/programming/effects) |
| A chase | Chase settings and its timeline | [Chases](/programming/chases) |

The demo rig's group view, with *Rig*'s settings, fixtures and cue pool:

<LivePreview preset="group-modifier" />

### Widgets

Each widget has a title bar with its icon. Lists in widgets work the same everywhere: click to
select, <kbd>Ctrl</kbd>+click to add to the selection, **Search items** to filter, and
<kbd>Delete</kbd> or <kbd>Backspace</kbd> to delete the selection (with a confirmation).
