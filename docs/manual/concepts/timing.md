# Timing and Playback

Studio runs every cue and chase on one clock, set in **BPM**. Durations are counted in **bars**,
not seconds, so a whole show speeds up or slows down with the tempo and stays in time.

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

Watch *Story* from start to end: each cue takes over on a bar, 2 bars after the previous one.

<LivePreview preset="chase-play" />

## Setting the Tempo

Type the **BPM** in the toolbar, or click **Tap Tempo** on the beat a few times: Studio measures the
time between your taps.

## Starting on the Bar

A chase's **Quantize** decides when it starts after you click it. With **1/1**, it waits for the
next bar, so chases you start a little early or late still land together on the downbeat. With
**None**, it starts at once.

> **Note:** In this release only **1/1** and **None** behave as named (see
> [Chases](/programming/chases#chase-settings)).

## Playing, Pausing

Click the play state in the toolbar, or press <kbd>Space</kbd>, to pause or resume. While paused,
cues and chases hold where they are. Output keeps running: your lights keep their current values,
and a fader you move is sent right away. Pausing is how you freeze a moving look to check it, or
hold the rig during a speech, without losing your place in a chase.

## How Cues End

| | **One Shot** | **Loop** |
| --- | --- | --- |
| Scene | Fades in over its duration, stops; its look stays | Stays on after its fade, until stopped |
| Effect | Runs its duration once, stops | Repeats until stopped (the default) |

A scene's **Start** sets where its fade begins: **Absolute** from 0, **Relative** from the
channels' current values, so it blends from whatever the previous cue left.

<SceneFade />

Use **Absolute** for a look that should always build the same way (a blackout lifting into a
scene); **Relative** for cross-fades between looks, as when *Sunset* takes over from *Warm wash*.

## Triggering

Clicking a cue or a chase starts it; clicking it again stops it. A group plays one chase at a time:
starting one stops the other. Master rows start and stop a chase in every group at once. See
[Playing a show](/programming/playback).

> **Note:** **Trigger Style** is saved with each cue but every cue toggles on click in this release:
> **Temporary** isn't available yet.
