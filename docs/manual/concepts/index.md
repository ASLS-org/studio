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

Read it from the bottom up and it is how a show plays: the **master** starts **chases**, chases
play **cues** at given times, cues write values into the **channels** of a **group**'s
**fixtures**, and every fixture's channels sit in a **universe** that is sent to your lights.

Every example on this page comes from the manual's demo show, the same rig as on the
[home page](/): four moving heads hung over a stage. Every live preview in the manual runs on it.
This page defines each part and links to the page where you see it work. Here is the demo show
in full:

<ShowMap />

## Show

Everything you build: universes and fixtures, groups with their cues and chases, the tempo and the
visualizer settings. A show is saved as a **showfile**, a JSON file the web and desktop versions
share, so a show programmed in the browser opens in the desktop app and the other way round.

What's playing is not part of the show: cues and chases you started, faders moved in the universe
view to check a fixture. Saving never stores them, and opening a show starts with everything
stopped.

**In the demo show:** the show is called *Manual demo* and runs at 120 BPM, so a bar (4 beats)
lasts 2 seconds.

## Universe

A block of 512 DMX channels, sent to your lights through one output (a USB interface, an Art-Net or
sACN node…). Studio counts its addresses from 0 to 511. A new show has four universes; add more as
your rig grows.

Universes are how the rig is wired, not how it is programmed: a group can hold fixtures of several
universes, and a cue doesn't care which universe a fixture is in.

**In the demo show:** one universe, *Stage*, holds the four heads; the patch bay lists them with
their addresses ([The interface](/getting-started/interface#patch-bay)).
→ [Patching fixtures](/programming/patching)

## Fixture

One light, patched in a universe at an **address**, in a **mode**. The mode decides which channels
it has and in which order: a shutter, a dimmer, pan and tilt, colour, a zoom… A fixture takes as
many addresses as its mode has channels, from its address on, so two fixtures must not overlap.

A fixture also has a **position** and a **rotation** on stage, in metres and degrees. They don't
change the DMX it receives: they place it in the visualizer, so what you see there matches the
real rig.

**In the demo show:** the four *MAC Aura* are moving heads in their *Standard* mode: 14 channels
each (shutter, dimmer, zoom, pan, tilt, red, green, blue, white…). *MAC Aura 1* takes addresses 0
to 13, so *MAC Aura 2* starts at 14, *MAC Aura 3* at 28 and *MAC Aura 4* at 42. They hang 6 m up,
3 m apart (x = −4.5, −1.5, 1.5 and 4.5 m), turned 180° so they point down.
→ [Patching fixtures](/programming/patching), [Fixture Library](/rig/fixtures)

### Cells

Some fixtures repeat a set of channels: each pixel of a bar has its own red, green and blue; each
head of a multi-head fixture its own pan and tilt. Each repeat is a **cell**. Scenes can give
every cell its own values, and effects can be spread over cells, so they travel from pixel to
pixel instead of moving the whole fixture at once. Channels that act on the whole fixture (a
master dimmer, a strobe) belong to no cell.

The demo rig's heads have one cell each. → [Cells](/rig/fixtures#cells), with a pixel bar to try

## Group

A set of fixtures you program together, from any universes. A fixture can be in several groups:
*all heads*, *left side*, *outer pair*. A group owns its **cues** and **chases**, and they only ever
touch the group's fixtures, so two groups can play at the same time without fighting over the
same lights, as long as their fixtures differ.

Each column of the group pool is one group, with its chases and its play buttons.

**In the demo show:** one group, *Rig*, holds the four heads. → [Groups](/programming/groups)

## Cue

Something a group does. A group's cues sit in its cue pool, one per slot, and a click on a cue
plays or stops it. There are two kinds:

| | Scene | Effect |
| --- | --- | --- |
| What it does | Brings channels to set values | Moves channels along a waveform |
| Values | One value per active channel, per fixture (per cell) | A min, a max, a waveform, a phase per fixture |
| Over its duration | Fades in, along its fade curve | Repeats its waveform **Freq** times |
| When it ends | Stops; its look stays on stage | Loops by default |

Every cue has a **Duration** in bars and a **Loop Style** (once, or until stopped). Scenes have a
**Start**: from 0, or from the channels' current values. Durations follow the tempo: double the
BPM and every fade and every effect runs twice as fast.

**In the demo show:** *Rig* has four cues.

- *Warm wash* (scene): amber pools in front of each head, at 90 %.
- *Rainbow* (effect): the colour cycles through the hues, one head a quarter-turn behind the next.
- *Ballyhoo* (effect): pan and tilt draw crossing circles, in blue.
- *Sunset* (scene): deep red to gold across the rig, beams fanned wide.

Watch them play: → [Scenes](/programming/scenes), [Effects](/programming/effects)

## Chase

A timeline of a group's cues. Each **cue item** says "play this cue from here, for this long". Items
on different lanes can overlap and play together: a colour effect over a position scene, for
example. A chase has a duration in bars, plays once or in a loop, and can wait for the next bar to
start. A group plays one chase at a time.

**In the demo show:** *Rig*'s chase *Story* lasts 8 bars (16 s): *Warm wash* in bars 1–2, *Rainbow*
in bars 3–4, *Ballyhoo* in bars 5–6, *Sunset* in bars 7–8. Each cue has its own lane.
→ [Chases](/programming/chases)

## Master

The column of rows on the right of the group pool. Row *n* of the master starts (or stops) chase
*n* of every group at once, so chases placed on the same row work as one look for the whole rig:
the lights on the left play their part, the lights on the right theirs, started on the same beat.

**In the demo show:** row 0 holds *Story*, the only chase. One click on the master's row 0 plays it,
as the group's own play button would; with more groups, the same click would start each group's
chase 0 together. → [Playing a show](/programming/playback#master-rows)

## What owns what

| Deleting… | Also removes |
| --- | --- |
| A fixture | It from every group, scene and effect |
| A fixture from a group | It from the group's cues only (it stays patched) |
| A cue | Its items in every chase |
| A group | Its cues and chases (its fixtures stay patched) |

Nothing is undone after you confirm a deletion, and there is no undo yet: save before a big
clean-up, or work on a copy of the showfile.
