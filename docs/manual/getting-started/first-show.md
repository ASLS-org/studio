# Your First Show

In about ten minutes, you'll build a small show from scratch: two PARs, a group, a red look, a
pulsing effect, and a chase that plays them in time. Open Studio next to this page: the
<ResourceLink to="demo">live demo</ResourceLink> runs in your browser with nothing to install, or
use the [desktop app](/introduction/installation).

You don't need any lights: Studio's [visualizer](/interface/visualizer/) shows what they would do.
Each step links to the page that explains it in full, with live demos on the manual's demo rig.

## 1. Start a Blank Show

In the toolbar, open **File** and pick **New Showfile**. Choose the **Blank** template and press
**Create**. The show has four empty universes and four empty groups.

## 2. Patch Two PARs

1. In the **Patch Bay** on the left, click **Universe 0**. The universe view opens at the bottom.
2. In its **Fixture Pool**, press **Add**.
3. In the popup, unfold **Bundled (GDTF)** and pick **Generic PAR RGBW**. Keep its first **Fixture
   mode** (6 channels).
4. Set **Amount** to `2` and **Offset X** to `3`, so the two PARs stand side by side.
5. Press **OK**.

With **Amount** `2`, Studio patches both at once, one after the other in the universe, each
**Offset X** further along.

The two PARs appear in the fixture pool and the visualizer. More in
[Patching fixtures](/programming/patching).

## 3. Make a Group

1. In the **Group Pool**, press **New**.
2. Tick **Check All** to take both PARs, name the group `Front`, and press **OK**.
3. Click the group's column: the group view opens at the bottom.

The group is what the next steps program: its cues and chases only ever touch its fixtures. More
in [Groups](/programming/groups).

## 4. A Red Scene

1. In the group's **Cue Pool**, double click the first empty slot.
2. Keep **scene**, name it `Red`, press **OK**. The scene is selected, and its widgets open on the
   right of the group view (scroll the strip sideways to reach them).
3. In **Scene Fixtures**, click the first PAR.
4. In **Channels**, tick the box under **CH1** (the dimmer, with the half-filled circle icon), then
   type `255` above its fader or push it to the top.
5. In the **Color Picker**, drag the hue to red, or type `0`, `100` and `100` in its **hue**,
   **sat** and **val** fields.
6. Click the second PAR in **Scene Fixtures** and repeat steps 4 and 5.

Click the scene's body in the cue pool: both PARs fade to red over one bar (its **Duration**), then
the scene stops and the red stays. Only ticked channels are part of the scene: anything you leave
unticked keeps whatever another cue gave it. More in [Scenes](/programming/scenes).

## 5. A Pulsing Effect

1. Double click the next empty slot of the **Cue Pool**, choose **effect** as **Cue type**, name
   it `Pulse`, press **OK**.
2. In **Modulated Channels**, press **Add**. In the **Add Modulated Channel** popup, unfold
   **Dimmer**, pick **dimmer** and press **OK**.
3. Click **Dimmer** in **Modulated Channels**, then in the **Effect Tool** set **Phase stop** to
   `180`: the two PARs now pulse in turn.

Play it from the cue pool to see it, then click it again to stop it. With **Phase stop** at `0`
both PARs would pulse together; at `180` the second is half a cycle behind the first, so one is
bright when the other is dark. More in [Effects](/programming/effects).

## 6. A Chase

1. In the group pool, double click the first empty chase slot of `Front`. The chase view opens.
2. Set its **Duration** to `2` bars.
3. In the timeline, double click the `Red` lane at its start (**1.0** on the ruler), then the
   `Pulse` lane at **2.0**. Each item lasts its cue's duration: one bar.

Lanes are the group's cues, in cue pool order. An item plays its cue from its left edge for its
length; a scene item fades in over its cue's duration and keeps its look until the next item
changes it. More in [Chases](/programming/chases).

## 7. Play It

In the group pool, click the chase's play button. It starts on the next bar: one bar of red, one
bar of pulse, again and again. Change the **BPM** in the toolbar, or tap it with
**Tap Tempo**: the chase follows.

Click the play button again to stop. More in [Playing a show](/programming/playback).

## 8. Save It

Press <kbd>Ctrl</kbd>+<kbd>S</kbd> (**File → Save Showfile Locally**) to keep it in Studio, or
**File → Export Showfile** to download it as a file. Studio doesn't save on its own.

## Next

- Learn how the parts fit together: [Show structure](/concepts/) and
  [Timing and playback](/concepts/timing).
- Find your way around the screen: [The interface](/getting-started/interface).
