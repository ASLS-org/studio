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
**Fade out**. A family nobody holds rests: the dimmers go back to 0 (dark), while colour, aim and
beam stay put until another cue takes them. Values you set by hand never become the rest: they
are in the [programmer](#the-programmer) until you clear them.

<LivePreview preset="group-cuepool" />

## The Programmer

Whatever you set in the [universe view](/programming/patching#trying-a-fixture) (a fader, a
value, a range, the colour picker, pan and tilt) goes into the **programmer**. It wins over every
cue, in every group, playing or not: take a light by hand during a show, and it stays where you put
it while the cues carry on with everything else. The programmer isn't saved with the show.

In the universe view's **Channels** widget, each channel says where its value comes from: its box
and fader turn violet in the programmer, blue while a cue drives it (or holds the value a cue
left), and keep their usual look at rest. Hover the box or the fader to read the source:
*Programmer*, *Colour cue: Warm wash*, *Kept from: Ballyhoo*, *Rest*. In the **Fixture Pool**,
fixtures in the programmer read **· prog** after their address.

**Clear** gives the channels back to playback at once:

- **Clear programmer** in the Channels widget's header clears the selected fixtures;
- **Clear** in a channel's menu clears that channel on the selected fixtures;
- **Preferences → Clear programmer** (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd>) clears every
  fixture.

Hand values never become the base cues come back to: with nothing playing, a cleared dimmer goes
back to 0. To keep a look, make it a [scene](/programming/scenes).

### Parking a Channel

A parked channel stays at its value whatever happens: above the cues, above the programmer, and
**Clear** leaves it alone. Use it for a hazer's output, a fixture's fan, or a light that must stay
on. Open the channel's menu (its box under the value) and pick **Park at …** (the current value) at the top: the
channel locks at that value on every selected fixture, turns red, and its fader and value
no longer move. Pick **Unpark** in the same place to free it, or press **Unpark** in the Channels
widget's header to free every parked channel of the selected fixtures.

Parked channels are saved with the show, and the fixtures read **· parked** in the Fixture Pool.

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

Under each group's chases are its masters. They change what the group sends, never what its cues
hold, and they aren't saved: a show always opens with every knob at full and every button off.

| Control | What it does |
| --- | --- |
| **Dimmer** knob | Scales the group's playback: at half, every level its cues and chases send goes out at half. Other groups' cues on the same fixtures and your [programmer](#the-programmer) values aren't affected. Double-click it to put it back to full |
| **Isolate** | Only isolated groups' playback is sent: every other group goes dark. Isolate several groups to keep them all. Turn the last one off to bring everyone back |
| **Blackout** | Sends the group's playback dark at once, without moving its knob. Off, it comes back at once |
| Activity dots | Light from the bottom with the highest level the group sends: bright up to what goes out, faint up to what its cues ask for. A group playing at full with its knob at 40 % shows one bright dot and four faint. Hover them to read the level |

Masters only touch levels: a fixture's dimmer, or its red, green, blue, white and amber when it has
no dimmer (an RGB PAR). Shutters, strobes, colour wheels, CMY and positions go out as the cues set
them. [Parked](#parking-a-channel) channels ignore every master.

When something other than its own knob holds a group dark (its **Blackout**, another group
isolated, or **DBO**), its knob turns grey: hover it to read why.

### Grand Master and DBO

At the bottom of the **Master** column:

- the **grand master** knob scales everything Studio sends, after the group knobs, your programmer
  values included: a group at half under a grand master at half goes out at a quarter;
- **Blackout** (DBO, "dead blackout") sends every level dark at once, without moving the grand
  master; only parked channels stay. Off, everything comes back at once.

The Master column's dots show the whole rig. Double-click the grand master to put it back to full.

## Running a Show

A simple way to run a night:

1. Program one group per kind of light, and on each, one chase per song part (intro, verse,
   chorus…), on the same rows across groups.
2. Set the **BPM** from the music with **Tap Tempo** before the first song, and keep each chase's
   **Quantize** on **1/1**.
3. Start each part from its master row a little before it begins: it lands on the next bar.
4. Keep a scene for the stops (a blackout, a warm wash for speeches) in each group's cue pool, to
   click by hand between songs.
