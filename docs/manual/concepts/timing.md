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

Effect and chase durations are whole numbers of bars; fade times are in bars too, in steps of a
hundredth. An effect's **Freq** counts waveform cycles per
duration, so its speed follows the tempo too.

| At 120 BPM | Lasts |
| --- | --- |
| A scene with a **Fade in** of 1 bar | 2 s fade |
| An effect with **Duration** 2 and **Freq** 1 | one cycle every 4 s |
| A chase with **Duration** 4 | 8 s per pass |

**In the demo show** (120 BPM): *Warm wash* and *Sunset* fade in over 1 bar, 2 s. *Rainbow* runs
over 2 bars, one hue cycle every 4 s. *Ballyhoo* has **Freq** 2 over 2 bars: two circles in 4 s,
twice as fast. The chase *Story* lasts 8 bars, 16 s. At 60 BPM, every one of those takes twice as
long, and the cues still change on the same beats.

## Starting on the Bar

When you start a chase, its **Quantize** decides when it actually begins: on the next bar
(**1/1**), so chases started a little early or late still land together on the downbeat, on the
next half bar, beat or half beat (**1/2**, **1/4**, **1/8**), or at once (**None**). At 120 BPM,
**1/1** waits up to 2 s and **1/4** up to half a second. The setting is a chase's
([Chases](/programming/chases#chase-settings)).

## How Cues End

A scene fades in, then stays on until you turn it off, which fades it out (see
[Fade In and Fade Out](/programming/scenes#fade-in-and-fade-out)). An effect's **Loop Style**
decides what happens at the end of its duration:

| **One Shot** | **Loop** |
| --- | --- |
| Runs its duration once, stops | Repeats until stopped (the default) |

Fades start from what the fixtures show and end on what takes over: see
[How a scene fades](/programming/scenes#how-a-scene-fades) and
[Fading in and out](/programming/effects#fading-in-and-out).

## What Plays Together

Every channel belongs to a **family**: **Intensity** (dimmer, shutter, strobe), **Colour**
(colour mixing, colour wheels, colour temperature), **Position** (pan and tilt) or **Beam** (zoom,
focus, gobos, prisms, iris, frost). A cue sets one family: the cue pool has a column per family,
and each column's **NOW** says where it comes from. Channels of no family (speeds, control) follow
the cue started last.

- **One cue per family in a group.** Starting a cue gives it each family it uses in its group,
  whatever fixtures each cue covers. A colour scene and a movement effect play together; a second
  colour scene takes Colour from the first. Fixtures you want to control apart go in their own
  groups.
- **Replace or Layer.** A cue's **Mode** says what happens to the cue it takes over. **Replace**
  turns that cue off once it has faded in; it doesn't come back. **Layer** plays over it and gives
  its families back when you stop it.
- **Turning a cue off** hands each of its families to the newest cue still playing that uses it.
- **A cue left with nothing turns off** by itself: its row shows it stopped. A chase item turned off this
  way stays off until its cue's next item.
- **A family nobody holds rests.** Intensity goes back to 0 (or a GDTF fixture's home value);
  colour, position and beam stay as they were when their last
  cue stopped (even half way through a fade, or on an effect's last step) until another cue takes
  them, and NOW reads "kept:" with that cue.
- **Above every cue:** what you set by hand in the universe view (the
  [programmer](/programming/playback#the-programmer)), and above that,
  [parked](/programming/playback#parking-a-channel) channels.
- **The cue started last wins** its family; there is no priority. To keep a cue on top of a
  running chase, hold it as a flash.
- **Flashes.** A **Temporary** cue covers what it reaches while you hold it, then hands it back; it
  never turns a cue off.
- **Groups sharing fixtures**: on a fixture two groups share, the cue started last wins that
  family.

**In the demo show:** start *Warm wash* in Intensity, Colour and Position. Start *Rainbow* in
Colour (Replace): it takes the colour, and *Warm wash*'s colour, left with nothing, turns off; its
level and aim play on. Start *Ballyhoo* in Position (Replace): the heads move, and *Warm wash*'s
aim turns off. Stop *Ballyhoo*: nothing holds Position any more, so the heads stay where it left
them ("kept: Ballyhoo").

- A group plays one chase at a time: starting one stops the other.
- A master row starts a chase in every group at once.
- Pausing freezes every cue and chase where it is; output keeps running.
