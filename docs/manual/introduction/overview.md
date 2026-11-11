# How Studio works

This page explains how a show is put together in Studio and how it reaches your lights. The rest
of the manual goes into each step in detail.

## A show, from rig to playback

Everything you build lives in one **show**:

| Part | What it is |
|---|---|
| **Universe** | A block of 512 DMX channels. A show can have several. |
| **Fixture** | One light, patched at an address in a universe. Its mode decides which channels it uses (dimmer, colour, pan, tilt…). |
| **Group** | A set of fixtures you control together. Cues and chases belong to a group. |
| **Cue** | Something a group does. A **scene** sets channels to fixed values and fades in and out. An **effect** moves channels with a waveform. |
| **Chase** | A timeline of a group's cues, measured in bars, that plays in time with the tempo. |
| **Master** | A row of triggers that starts the chases on the same row in every group at once. |

A typical show comes together in this order:

1. **Patch** your fixtures into a universe and give each one a position on stage.
   [Patching fixtures](/programming/patching)
2. **Group** the fixtures you want to control together.
   [Groups](/programming/groups)
3. **Program** cues for each group: scenes for looks, effects for movement.
   [Scenes](/programming/scenes), [Effects](/programming/effects)
4. **Sequence** cues into chases if you want them to follow the music.
   [Chases](/programming/chases)
5. **Play**: set the tempo, trigger cues, chases and master rows.
   [Playing a show](/programming/playback)

This is where those steps lead, on the manual's demo rig: four moving heads patched in one
universe, one group, four cues, and a chase *Story* that plays them over 8 bars. Every page of the
manual uses this rig in its examples ([Show structure](/concepts/) walks through it).

<LivePreview preset="chase-play" />

To try it with your own hands, open the <ResourceLink to="demo">live demo</ResourceLink>: Studio
in your browser, with a demo show loaded, nothing to install.

## Time is counted in bars

Studio has one clock for the whole show, set in **BPM** in the toolbar (or tapped in with
**Tap Tempo**). Effect speeds, chase lengths and quantization are all counted in beats and bars,
so when the tempo changes, everything stays in time.

## The screen

Studio's window has five regions:

| Region | Use it to |
|---|---|
| [Toolbar](/interface/toolbar/) | Open and save showfiles, set preferences, control the tempo and playback |
| [Patch Bay](/getting-started/interface#patch-bay) | Browse universes and the fixtures patched in them |
| [Group Pool](/getting-started/interface#group-pool) | See every group with its chases, and fire them |
| [Visualizer](/interface/visualizer/) | Watch the rig in 3D |
| [Modifier](/getting-started/interface#modifier-strip) | Edit whatever you selected: a universe, a group and its cues, or a chase |

## From Studio to your lights

Studio talks to DMX hardware through a small companion program called the **WSC gateway**. The
gateway receives Studio's output and sends it to your lights over Art-Net, sACN or a USB DMX
interface.

- In the **desktop app**, the gateway is built in and starts with Studio.
- In the **browser**, you run the gateway yourself on the same computer, and Studio connects to
  it.

You add a connection to the gateway in **Preferences → Outputs**
(<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd>). Then, in each universe's settings, you choose
which connection and protocol it uses. Without a gateway, Studio still works: the visualizer shows
exactly what your lights would do.

## Saving your show

Showfiles are handled from the toolbar's **File** menu:

| Action | Shortcut | What it does |
|---|---|---|
| **Save Showfile Locally** | <kbd>Ctrl</kbd>+<kbd>S</kbd> | Stores the show in this browser (or the desktop app), so it reopens next time |
| **Export Showfile** | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> | Downloads the show as a showfile |
| **Load Showfile** | <kbd>Ctrl</kbd>+<kbd>O</kbd> | Opens a showfile from your computer |
| **New Showfile** | <kbd>Shift</kbd>+<kbd>N</kbd> | Starts a blank show or the demo show |

A `*` before the show's name in the toolbar means you have changes that aren't saved yet.
Studio doesn't save on its own, so save before you close the window.

A showfile is a plain JSON file you can back up, share, put under version control or generate
with your own scripts. The same showfiles work in the web and desktop versions.

## Web or desktop?

| | Web | Desktop |
|---|---|---|
| Install | Nothing, open it in Chrome, Edge or Firefox | macOS, Windows or Linux app |
| Output to lights | Run the WSC gateway yourself | Gateway built in |
| Showfiles | Same format | Same format |

See [Installation](/introduction/installation) to get started.
