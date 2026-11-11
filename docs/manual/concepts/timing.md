# Timing and Playback

Studio runs every cue and chase on one clock, set in **BPM**. Durations are counted in **bars**,
not seconds, so a whole show speeds up or slows down with the tempo and stays in time. This page
explains the units; how to set the tempo and play the show is in
[Playing a show](/programming/playback).

## Beats and Bars

| Unit | Length |
| --- | --- |
| Beat | 60 ÷ BPM seconds: 0.5 s at 120 BPM |
| Bar | 4 beats: 2 s at 120 BPM, 4 s at 60 BPM |

Cue and chase durations are whole numbers of bars. An effect's **Freq** counts waveform cycles per
duration, so its speed follows the tempo too.

| At 120 BPM | Lasts |
| --- | --- |
| A scene with **Duration** 1 | 2 s fade |
| An effect with **Duration** 2 and **Freq** 1 | one cycle every 4 s |
| A chase with **Duration** 4 | 8 s per pass |

**In the demo show** (120 BPM): *Warm wash* and *Sunset* fade in over 1 bar, 2 s. *Rainbow* runs
over 2 bars, one hue cycle every 4 s. *Ballyhoo* has **Freq** 2 over 2 bars: two circles in 4 s,
twice as fast. The chase *Story* lasts 8 bars, 16 s. At 60 BPM, every one of those takes twice as
long, and the cues still change on the same beats.

## Starting on the Bar

When you start a chase, its **Quantize** decides when it actually begins: on the next bar, so
chases started a little early or late still land together on the downbeat, or at once. The
setting is a chase's ([Chases](/programming/chases#chase-settings)).

## How Cues End

A cue's **Loop Style** decides what happens at the end of its duration:

| | **One Shot** | **Loop** |
| --- | --- | --- |
| Scene | Fades in over its duration, stops; its look stays | Stays on after its fade, until stopped |
| Effect | Runs its duration once, stops | Repeats until stopped (the default) |

A scene's **Start** sets where its fade begins, from 0 or from the current values: see
[How a scene fades](/programming/scenes#how-a-scene-fades).

## What Plays Together

- Several cues of a group can play at once; when they set the same channel, the last one to write
  it wins.
- A group plays one chase at a time: starting one stops the other.
- A master row starts a chase in every group at once.
- Pausing freezes every cue and chase where it is; output keeps running.
