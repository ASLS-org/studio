# Chases

A chase plays a group's cues on a timeline, in time with the show's tempo: a scene on the first
bar, an effect over the next two, another scene at the end. Each group has its own chases, in its
column of the **Group Pool**; a group plays one chase at a time.

Chases are how a show runs by itself: instead of clicking cues on the beat, you lay them out once,
and the chase plays them in time, at whatever tempo the music is.

**In the demo show:** *Rig*'s chase *Story* lasts 8 bars and loops. Each of the four cues has an
item 2 bars long, one after the other: *Warm wash*, *Rainbow*, *Ballyhoo*, *Sunset*. Played, it
tells the same story as the home page: watch it in [Playing a show](/programming/playback#chases).

## Creating a Chase

Double click an empty chase slot in a group's column of the group pool. The new chase opens in the
**chase view** at the bottom of the screen, with a lane for each of the group's cues, under the
same family heads as the cue pool.

Click a chase's name in the group pool to open it later. Below is *Story* in the chase view.

<LivePreview preset="chase-modifier" />

## Chase Settings

| Setting | Description |
| --- | --- |
| **Name** | The chase's name |
| **Duration** | The chase's length, in bars (1–99) |
| **Color** | The chase's colour in the group pool |
| **Quantize** | When a chase you start actually begins: on the next **1/8** note (half a beat), **1/4** (beat), **1/2** (2 beats) or **1/1** (bar), or at once with **None** |
| **Trigger** | **Loop** plays the chase until you stop it; **One Shot** plays it once |

Durations are in bars, so a chase stays in time when the tempo changes: at 120 BPM, a 4-bar chase
lasts 8 seconds; at 60 BPM, 16 seconds.

## The Timeline

Each lane is one of the group's cues, under its family's head (**Intensity**, **Colour**,
**Position**, **Beam**, in the cue pool's order), each family in its colour: Intensity gold,
Colour pink, Position blue, Beam green, on its head, its lanes' edges, its items and the bars
saying who holds it. The ruler counts bars and beats. A **cue item** on a lane
plays that cue from where it starts, for as long as it lasts. The item starts the cue with its
**Fade in** and ends with its **Fade out**, so the cue has faded out when the item ends. The item
draws these fades: the fade in curve at its start, a flat line while the cue holds, the fade out
curve at its end.

Stretching an item makes the cue hold longer; its fades keep their own times. An item shorter than
both fades together plays them shortened, in proportion, effects as scenes (see
[Fading in and out](/programming/effects#fading-in-and-out)).

- **Add** a cue item: double click its lane where it should start. An effect's item gets its
  **Duration**, a scene's is long enough for its fades (one bar at least), or less if another
  item follows.
- **Move** it: drag its middle. **Resize** it: drag its right edge.
- **Remove** it: right click it.
- **Zoom**: drag up or down on the ruler; double click the ruler to reset.
- **Fold cues** hides the lanes that have no items, and the families with none.

<LivePreview preset="timeline-add" />

Items on different lanes can overlap: their cues then play together, family by family, as when
you start them by hand (see [What plays together](/concepts/timing#what-plays-together)). Put
*Rainbow* over the second half of *Warm wash* and the heads keep their warm aim while their colour
starts cycling: *Rainbow* takes Colour and Intensity, *Warm wash* keeps Position and Beam. Items
back to back on a family replace each other, as a colour chase does.

### Who Holds What

The timeline draws what its items do to the stage, by the same rules as playing by hand:

- **Each family's head** shows, along the time, which cue holds that family, with its picture and
  name. Read it as the chase's NOW over time. Click a family's head to fold its lanes (the head
  stays); click again to show them.
- **A striped stretch** of an item is on, but covered: other items hold all of its families
  there (a **Layer** effect over it). It shows again when they end.
- **A dimmed stretch** is off: a **Replace** item took all of its families and turned it off. It
  stays off until its cue's next item.
- **Rest the pointer on an item** to read its **Mode**, and what covers it or turns it
  off, from when.

The drawing counts the chase's own items only: cues you play by hand and other groups can still
change what the lights show (the cue pool's NOW always tells).

### When an item ends

| Cue | At the item's end |
| --- | --- |
| A cue with a **Fade out** | It has faded into the cue it hands its families back to (or, with none, they rest) |
| A cue with no **Fade out** | It keeps its families, its row showing it playing, until another cue takes them, the chase stops, or you press its stop button in the cue pool |

Stopping a chase hands back what its items hold, and so does a **One Shot** chase reaching its
end. To finish on a known look, start that scene from the cue pool as the chase ends: it stays on.

## Deleting a Chase

With the chase open in the chase view, press <kbd>Delete</kbd> or <kbd>Backspace</kbd>. The chase
is deleted at once, without a confirmation.

## Playing Chases

See [Playing a show](/programming/playback#chases).
