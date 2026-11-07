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

## Show

Everything you build: universes and fixtures, groups with their cues and chases, the tempo and the
visualizer settings. A show is saved as a **showfile**, a JSON file the web and desktop versions
share. Live values (what's playing, faders moved in the universe view) aren't part of it.

## Universe

A block of 512 DMX channels, sent to your lights through one output. Studio counts its addresses
from 0 to 511. A new show has four universes.

## Fixture

One light, patched in a universe at an **address**, in a **mode**. The mode decides which channels
it has and in which order: a dimmer, colour channels, pan and tilt, a zoom… A fixture takes as many
addresses as its mode has channels, from its address on. It also has a position and rotation on
stage, for the visualizer.

### Cells

Some fixtures repeat a set of channels: each pixel of a bar has its own red, green and blue; each
head of a multi-head fixture its own pan and tilt. Each repeat is a **cell**. Scenes can give
every cell its own values, and effects can travel from cell to cell. Channels that act on the
whole fixture (a master dimmer, a strobe) belong to no cell.

## Group

A set of fixtures you program together, from any universes. A fixture can be in several groups. A
group owns its **cues** and **chases**: they only ever touch the group's fixtures.

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

## Chase

A timeline of a group's cues. Each **cue item** says "play this cue from here, for this long".
Items on different lanes can overlap and play together. A chase has a duration in bars, plays once
or in a loop, and can wait for the next bar to start. A group plays one chase at a time.

## Master

The column of rows on the right of the group pool. Row *n* of the master starts (or stops) chase
*n* of every group at once, so chases placed on the same row work as one look for the whole rig.

## What owns what

| Deleting… | Also removes |
| --- | --- |
| A fixture | It from every group, scene and effect |
| A fixture from a group | It from the group's cues only (it stays patched) |
| A cue | Its items in every chase |
| A group | Its cues and chases (its fixtures stay patched) |
