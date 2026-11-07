# Show Structure

[How Studio works](/introduction/overview) gives the big picture. This page defines each part of a
show, what it owns and how the parts refer to each other, so the rest of the manual reads
precisely.

```
Show
├─ Universes ─ Fixtures (each at an address, in a mode; some made of cells)
├─ Groups ──── fixtures of any universe
│   ├─ Cues ── Scenes and Effects
│   └─ Chases ─ cue items on a timeline
└─ Master ─── rows of chases across all groups
```

Every example on this page comes from the manual's demo show, the one all live previews run on.
Here it is in full:

<ShowMap />

## Show

Everything you build: universes and fixtures, groups with their cues and chases, the tempo and the
visualizer settings. A show is saved as a **showfile**, a JSON file the web and desktop versions
share. Live values (what's playing, faders moved in the universe view) aren't part of it.

**In the demo show:** the show is called *Manual demo* and runs at 120 BPM.

## Universe

A block of 512 DMX channels, sent to your lights through one output. Studio counts its addresses
from 0 to 511. A new show has four universes.

**In the demo show:** one universe, *Stage*, holds all five fixtures. Unfold it in the patch bay to
see them with their addresses:

<LivePreview preset="patch-bay" />

## Fixture

One light, patched in a universe at an **address**, in a **mode**. The mode decides which channels
it has and in which order: a dimmer, colour channels, pan and tilt, a zoom… A fixture takes as many
addresses as its mode has channels, from its address on. It also has a position and rotation on
stage, for the visualizer.

**In the demo show:** *MAC Aura 1* is a moving head in its *Standard* mode: 14 channels (shutter,
dimmer, zoom, pan, tilt, colour…), so it takes addresses 0 to 13 and *MAC Aura 2* starts at 14. The
two PARs use a 5-channel mode: red, green, blue, dimmer, shutter.

### Cells

Some fixtures repeat a set of channels: each pixel of a bar has its own red, green and blue; each
head of a multi-head fixture its own pan and tilt. Each repeat is a **cell**. Scenes can give
every cell its own values, and effects can travel from cell to cell. Channels that act on the
whole fixture (a master dimmer, a strobe) belong to no cell.

**In the demo show:** the *ColorBand Pix* is a bar of 12 cells, each with its own red, green and
blue: 36 channels. Its effect *Rainbow* runs a colour cycle along the cells, and its scene *Split*
gives them alternating colours:

<LivePreview preset="pixel-stage" />

## Group

A set of fixtures you program together, from any universes. A fixture can be in several groups. A
group owns its **cues** and **chases**: they only ever touch the group's fixtures.

**In the demo show:** three groups, one per kind of fixture: *Moving heads* (the two MAC Auras),
*Pixel bar* and *PARs*. Each column of the group pool is one group, with its chases:

<LivePreview preset="group-pool" />

## Cue

Something a group does. A group's cues sit in its cue pool. There are two kinds:

| | Scene | Effect |
| --- | --- | --- |
| What it does | Brings channels to set values | Moves channels along a waveform |
| Values | One value per active channel, per fixture (per cell) | A min, a max, a waveform, an offset per fixture |
| Over its duration | Fades in, along its fade curve | Repeats its waveform **Freq** times |
| When it ends | Stops; its look stays on stage | Loops by default |

Every cue has a **Duration** in bars and a **Loop Style** (once, or until stopped). Scenes have a
**Start**: from 0, or from the channels' current values.

**In the demo show:** the *Moving heads* group has two scenes, *Open white* (white, straight down)
and *Deep blue* (blue, heads slightly apart), and two effects, *Circle* (pan and tilt draw a
circle) and *Hue shift* (the colour cycles). Watch what each does to the rig:

<LivePreview preset="scene-stage" />

<LivePreview preset="effect-stage" />

## Chase

A timeline of a group's cues. Each **cue item** says "play this cue from here, for this long".
Items on different lanes can overlap and play together. A chase has a duration in bars, plays once
or in a loop, and can wait for the next bar to start. A group plays one chase at a time.

**In the demo show:** the *Moving heads* group's chase *Looks* lasts 4 bars: *Open white* in bar 1,
*Deep blue* in bar 2, *Circle* in bar 3, *Hue shift* in bar 4.

<LivePreview preset="chase-timeline" />

## Master

The column of rows on the right of the group pool. Row *n* of the master starts (or stops) chase
*n* of every group at once, so chases placed on the same row work as one look for the whole rig.

**In the demo show:** row 0 holds *Looks*, *Bar loop* and *PAR loop*: one click on the master's
row 0 plays all three together.

<LivePreview preset="master-row" />

## What owns what

| Deleting… | Also removes |
| --- | --- |
| A fixture | It from every group, scene and effect |
| A fixture from a group | It from the group's cues only (it stays patched) |
| A cue | Its items in every chase |
| A group | Its cues and chases (its fixtures stay patched) |
