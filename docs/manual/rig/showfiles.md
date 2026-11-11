# Showfiles

A **showfile** holds a whole show: universes and fixtures with their addresses and positions,
groups with their cues and chases, the tempo and the visualizer's look. It's a `.json` file, the
same for the web and desktop versions, so a show programmed in one opens in the other, or on
another computer.

What's playing isn't saved: cues and chases you started, faders moved in the universe view.
Opening a show starts with everything stopped.

All showfile actions are in the toolbar's **File** menu:

<LivePreview preset="toolbar-file" />

| Entry | Shortcut | What it does |
| --- | --- | --- |
| **New Showfile** | <kbd>Shift</kbd>+<kbd>N</kbd> | Starts a new show from a template |
| **Load Showfile** | <kbd>Ctrl</kbd>+<kbd>O</kbd> | Opens a showfile from your computer |
| **Save Showfile Locally** | <kbd>Ctrl</kbd>+<kbd>S</kbd> | Keeps the show in Studio, for next time |
| **Export Showfile** | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> | Downloads the show as a file |

Shortcuts use the <kbd>Ctrl</kbd> key on every system, Mac included.

## Where Your Show Lives

Studio keeps **one** show, the one you're working on, in its own storage: the browser's for the
web version, the app's for the desktop version. That's where **Save Showfile Locally** writes,
and what Studio opens when you come back.

- Studio doesn't save on its own. A `*` before the show's name in the toolbar means changes
  since the last save: press <kbd>Ctrl</kbd>+<kbd>S</kbd>.
- Opening or starting another show replaces the one kept in Studio at once, saved or not.
  **Export** first if you want to keep it.
- Browser storage belongs to the browser and the site: another browser, a private window, or
  clearing the site's data starts from the demo show again.

**Export Showfile** is how you keep shows for good: it downloads `<show name>.json` to your
downloads folder, to back up, copy to another computer or send to someone.

> **Tip:** Export before every big change and at the end of each session. Name the file by date
> (`concert-2026-11-14.json`) to keep a history: there's no undo yet.

## Starting a Show

**File → New Showfile** opens **New Project**. Pick a template and press **Create**:

| Template | What you get |
| --- | --- |
| **Blank** | Four empty universes and four empty groups |
| **ASLS Demo** | The demo show Studio opens with the first time: a rig already patched and programmed, to explore |

The new show replaces the one kept in Studio (see above).

## Opening a Showfile

**File → Load Showfile** asks for a file: pick a `.json` showfile (one you exported, or
`.asls`). Studio opens it, keeps it as its current show and reloads the window.

If the show uses GDTF fixtures this computer hasn't imported, **Missing fixtures** asks for their
files first: see [Opening a show with missing fixtures](/rig/fixtures#opening-a-show-with-missing-fixtures).

## Moving a Show to Another Computer

1. On the first computer: **File → Export Showfile**.
2. Copy the `.json` file, along with the `.gdtf` files of any imported fixtures.
3. On the other computer: **File → Load Showfile**, then import the GDTF files when asked.
4. Set up outputs again: connections and universe streams aren't part of the showfile yet
   ([Outputs](/rig/outputs#what-s-verified)).

## First Run

The first time Studio opens (or after its storage is cleared), it loads the **ASLS Demo** show, so
there's something to play with. Start your own with **File → New Showfile → Blank**.

## Older Showfiles

Showfiles from earlier versions of Studio open in this one. Settings added since take their
default (for example the visualizer's haze opens at a density of 50). A showfile saved by this
version may not open in an older one.
