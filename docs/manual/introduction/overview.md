# How Studio works

This page is the big picture: how a show is put together in Studio and how it reaches your lights.
Each step has its own page.

## A show, from rig to playback

Everything you build lives in one **show**. You **patch** your lights (fixtures) into universes,
gather them into **groups**, give each group **cues** (scenes for looks, effects for movement),
lay those cues out on **chases** that follow the music, and **play** it all from the group pool.
[Show structure](/concepts/) defines each part, with the manual's demo show as the example.

A typical show comes together in this order:

1. **Patch** your fixtures into a universe and give each one a position on stage.
   [Patching fixtures](/programming/patching)
2. **Group** the fixtures you want to control together.
   [Groups](/programming/groups)
3. **Program** cues for each group: scenes for looks, effects for movement.
   [Scenes](/programming/scenes), [Effects](/programming/effects)
4. **Sequence** cues into chases if you want them to follow the music.
   [Chases](/programming/chases)
5. **Play**: set the tempo, trigger cues, chases and master rows.
   [Playing a show](/programming/playback)

Every page uses the same demo rig: four moving heads, one group, four cues and an 8-bar chase. Its
pages show Studio's real components live, and the floating visualizer card shows what they do to
the rig. To try Studio with your own hands, open the <ResourceLink to="demo">live demo</ResourceLink>.

## Time is counted in bars

Studio has one clock for the whole show, set in **BPM**. Fades, effects and chases are counted in
bars of four beats, so when the tempo changes, everything stays in time.
[Timing and playback](/concepts/timing)

## From Studio to your lights

Studio computes DMX and hands it to a small program, the **gateway**, that sends it to your lights
over Art-Net. The desktop app has the gateway built in; with the browser version you run it
yourself. Without lights, Studio still works: the visualizer shows exactly what they would do.
[Outputs](/rig/outputs)

## Keeping your show

Studio doesn't save on its own: save to keep the show in Studio, export to keep a file you can
back up, move or share. The same showfiles work in the web and desktop versions.
[Showfiles](/rig/showfiles)

## Web or desktop

Both have the same interface. The browser version needs nothing installed; the desktop app has
the gateway built in, for real lights. [Installation](/introduction/installation)
