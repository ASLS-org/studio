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

See [Timing and playback](/concepts/timing) for how bars, BPM and quantize fit together.

## Cues

In a group's **Cue Pool**, click a cue's body to start it, and again to stop it. A playing cue
shows its progress. A **One Shot** cue stops by itself at the end of its **Duration**; a scene's look
then stays on stage. A **Loop** cue runs until you stop it.

Several cues of a group can play together; when they set the same channel, the last one to write it
wins.

<LivePreview preset="group-cuepool" />

## Chases

In the group pool, click a chase's play button to start it, and again to stop it. A chase starts on
its **Quantize** boundary (the next bar with **1/1**), and starting it stops the group's other
chase. The chase shows its progress while it plays.

<LivePreview preset="chase-play" />

To stop every chase of a group, click the play button of an empty slot in that group's column.

## Master Rows

The **Master** column on the right of the group pool plays a whole row: its play button starts the
chase on that row in every group at once, and a second click stops them. Put the chases that belong
together on the same row (a verse look in row 1 of every group, a chorus in row 2) to change the
whole rig with one click.

<LivePreview preset="master-row" />

## Group Controls

Under each group's chases:

- the **activity meter** (five dots) shows how much the group is outputting;
- the **dimmer** knob, **Isolate** and **Blackout** are saved with the show.

> **Note:** In this release, the group **dimmer** knob, **Isolate** and **Blackout** don't change
> what the group outputs yet, and the master column's knob and buttons do nothing. Stop the group's
> cues and chases to darken it.
