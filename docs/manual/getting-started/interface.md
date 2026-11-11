# The Interface

Studio's window has five regions. You pick something in one (a universe, a group, a chase) and
edit it in another, so knowing where things are is most of learning Studio.

| Region | Where | Use it to |
| --- | --- | --- |
| [Toolbar](#toolbar) | Top | Open and save shows, set preferences and outputs, run the clock |
| [Patch Bay](#patch-bay) | Left | Browse universes and their fixtures |
| [Group Pool](#group-pool) | Middle | See groups and their chases, start chases and master rows |
| [Visualizer](#visualizer) | Right | Watch the rig in 3D |
| [Modifier strip](#modifier-strip) | Bottom | Edit what you picked: a universe, a group and its cues, or a chase |

## Toolbar

Menus on the left (**File**, **Preferences**, **About**), the show's name in the middle (a `*`
before it means unsaved changes), the clock on the right: **BPM**, the play state and
**Tap Tempo**.

<LivePreview preset="toolbar-menus" />

More in [Toolbar](/interface/toolbar/) and [Playing a show](/programming/playback#the-clock).

## Patch Bay

Lists the universes, each unfolding to its fixtures with their address (`U0 - CH14`: universe 0,
address 14). Unfold a universe to open it in the modifier strip; click a fixture to select it
there. Type in **Search items** to find fixtures across universes.

<LivePreview preset="patch-bay" />

More in [Patching fixtures](/programming/patching).

## Group Pool

One column per group, with its chases in rows, and the **Master** column on the right. Click a
group's name to open it in the modifier strip; click a chase to open it; click a chase's play button
to start it. **New** creates a group.

<LivePreview preset="group-pool" />

More in [Groups](/programming/groups), [Chases](/programming/chases) and
[Playing a show](/programming/playback).

## Visualizer

Your rig in 3D, driven by the same values that go to your lights. Drag to orbit, scroll to zoom.

<LivePreview preset="visualizer" />

More in [Visualizer](/interface/visualizer/).

## Modifier Strip

The bottom of the window shows the editing **view** for what you picked, as a row of widgets. When
they don't fit, scroll the strip sideways.

| You picked | The strip shows | Page |
| --- | --- | --- |
| A universe or a fixture | Universe settings, its fixture pool, the fixture's settings, position and controls | [Patching fixtures](/programming/patching) |
| A group | Group settings, its fixture pool, its cue pool, and the selected cue's widgets | [Groups](/programming/groups), [Scenes](/programming/scenes), [Effects](/programming/effects) |
| A chase | Chase settings and its timeline | [Chases](/programming/chases) |

<LivePreview preset="group-modifier" />

### Widgets

Each widget has a title bar with its icon. Lists in widgets work the same everywhere: click to
select, <kbd>Ctrl</kbd>+click to add to the selection, **Search items** to filter, and
<kbd>Delete</kbd> or <kbd>Backspace</kbd> to delete the selection (with a confirmation).
