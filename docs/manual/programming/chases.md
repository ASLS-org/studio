# Chases

A chase plays a group's cues on a timeline, in time with the show's tempo: a scene on the first
bar, an effect over the next two, another scene at the end. Each group has its own chases, in its
column of the **Group Pool**; a group plays one chase at a time.

Chases are how a show runs by itself: instead of clicking cues on the beat, you lay them out once,
and the chase plays them in time, at whatever tempo the music is.

**In the demo show:** *Rig*'s chase *Story* lasts 8 bars and loops. Each of the four cues has an
item 2 bars long, one after the other: *Warm wash*, *Rainbow*, *Ballyhoo*, *Sunset*. Played, it
tells the same story as the home page:

<LivePreview preset="chase-play" />

## Creating a Chase

Double click an empty chase slot in a group's column of the group pool. The new chase opens in the
**chase view** at the bottom of the screen, with a lane for each of the group's cues.

Click a chase's name in the group pool to open it later. Below is *Story* in the chase view.

<LivePreview preset="chase-modifier" />

## Chase Settings

| Setting | Description |
| --- | --- |
| **Name** | The chase's name |
| **Duration** | The chase's length, in bars (1–99) |
| **Color** | The chase's colour in the group pool |
| **Quantize** | When a chase you start actually begins: **1/1** waits for the start of the next bar, **None** starts at once |
| **Trigger** | **Loop** plays the chase until you stop it; **One Shot** plays it once |

Durations are in bars, so a chase stays in time when the tempo changes: at 120 BPM, a 4-bar chase
lasts 8 seconds; at 60 BPM, 16 seconds.

> **Note:** In this release, **1/8**, **1/4** and **1/2** wait 1, 2 and 3 beats rather than the
> fraction of a bar their name says. Use **1/1** or **None**.

## The Timeline

Each lane is one of the group's cues; the ruler counts bars and beats. A **cue item** on a lane
plays that cue from where it starts, for as long as it lasts.

<LivePreview preset="chase-timeline" />

- **Add** a cue item: double click its lane where it should start. It gets the cue's duration, or
  less if another item follows.
- **Move** it: drag its middle. **Resize** it: drag its right edge.
- **Remove** it: right click it.
- **Zoom**: drag up or down on the ruler; double click the ruler to reset.
- **Fold cues** hides the lanes that have no items.

<LivePreview preset="timeline-add" />

Items on different lanes can overlap: their cues then play together. Overlaps are how you layer:
put *Rainbow* over the second half of *Warm wash* and the heads keep their warm aim while their
colour starts cycling, because *Rainbow* only moves colour channels.

### When an item ends

| Cue | At the item's end |
| --- | --- |
| Scene | Its look stays until another item changes the same channels |
| Effect | It stops; its channels keep the value they had at that moment |

So a chase that ends on an effect leaves the lights wherever the effect was. End on a scene (as
*Story* does with *Sunset*) for a clean, known look.

## Deleting a Chase

With the chase open in the chase view, press <kbd>Delete</kbd> or <kbd>Backspace</kbd>. The chase
is deleted at once, without a confirmation.

## Playing Chases

See [Playing a show](/programming/playback#chases).
