# Playing a Show

Once your cues and chases are programmed, you play the show from the **Group Pool** and the
**Toolbar**: start and stop cues, chases and whole rows of chases, at the tempo you set.

## The Clock

Everything runs on one clock, shown in the toolbar:

| Control | Description |
| --- | --- |
| **BPM** | The tempo, in beats per minute. Cue and chase durations are in bars of 4 beats, so they follow it |
| Play state (**playing**, **paused**) | Click it, or press <kbd>Space</kbd>, to pause or resume the show. Paused, cues and chases freeze where they are; your lights keep their current values |
| **Tap Tempo** | Click it on the beat a few times to set the BPM from your taps |

Pausing is how you freeze a moving look to check it, or hold the rig during a speech, without
losing your place in a chase: output keeps running, your lights keep their current values, and a
fader you move is sent right away. How bars, BPM and quantize fit together:
[Timing and playback](/concepts/timing).

## Cues

In a group's **Cue Pool** ([Scenes](/programming/scenes#the-cue-pool) describes it), click a
cue's **play** button to start it, and again to turn it off; hold it for a **Temporary** cue
([Cue settings](/programming/scenes#cue-settings)). A click on the row itself only opens the cue
([Programming blind](/programming/scenes#programming-blind)). A playing cue's row fills with its
progress. A scene stays on once faded in. A **One Shot** effect stops by itself at the end of its
**Duration** (fading out first in **Layer**); a **Loop** effect runs until you stop it.

A group plays one cue per family. Each column's **NOW** says what the stage shows of that family
and where it comes from: a cue, a chase's item, a value kept from a stopped cue, or rest. A striped
row is on but covered: other cues hold every family it sets, and it comes back when they stop (see
[What plays together](/concepts/timing#what-plays-together)).

In the preview, play *Warm wash* in Intensity and in Colour: the heads light up amber. Play
*Rainbow* in Colour: a **Replace** effect, it takes the colour and *Warm wash*'s colour turns off,
while its level stays. Play *Ballyhoo* in Position: the heads move. Stop it: they stay where it
left them, NOW reads "kept: Ballyhoo", and its row keeps its fill where it stopped.

Turning a cue off hands its families to the newest cue still playing that uses them, over its
**Fade out**. A family nobody holds rests: the dimmers go back to where they were before you played
anything (dark, unless you set them in the universe view), while colour, aim and beam stay put
until another cue takes them.

<LivePreview preset="group-cuepool" />

## Chases

In the group pool, click a chase's play button to start it, and again to stop it. A chase starts on
its **Quantize** boundary (the next bar with **1/1**), and starting it stops the group's other
chase. The chase shows its progress while it plays.

<LivePreview preset="chase-play" />

To stop every chase of a group, click the play button of an empty slot in that group's column.

The preview plays *Story* to its end: 16 s at 120 BPM, a new cue every 2 bars, then stops it.

## Master Rows

The **Master** column on the right of the group pool plays a whole row: its play button starts the
chase on that row in every group at once, and a second click stops them. Put the chases that belong
together on the same row (a verse look in row 1 of every group, a chorus in row 2) to change the
whole rig with one click.

With one group, a master row does what the group's own play button does; it pays off with
several groups. Say *Heads* and *PARs* each have a verse chase in row 0 and a chorus in row 1:
row 0 of the master plays both verses together, row 1 both choruses, on the same bar.

<LivePreview preset="master-row" />

## Group Controls

Under each group's chases:

- the **activity meter** (five dots) shows how much the group is outputting;
- the **dimmer** knob, **Isolate** and **Blackout** are saved with the show.

> **Note:** In this release, the group **dimmer** knob, **Isolate** and **Blackout** don't change
> what the group outputs yet, and neither do the master column's knob and **Blackout**. Stop the
> group's cues and chases to darken it ([Known limitations](/reference/limitations#programming)).

## Running a Show

A simple way to run a night:

1. Program one group per kind of light, and on each, one chase per song part (intro, verse,
   chorus…), on the same rows across groups.
2. Set the **BPM** from the music with **Tap Tempo** before the first song, and keep each chase's
   **Quantize** on **1/1**.
3. Start each part from its master row a little before it begins: it lands on the next bar.
4. Keep a scene for the stops (a blackout, a warm wash for speeches) in each group's cue pool, to
   click by hand between songs.
