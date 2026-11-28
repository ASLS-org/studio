# Glossary

The terms this manual uses, in alphabetical order.

| Term | Meaning |
| --- | --- |
| **Address** | Where a fixture listens in its universe: the first of its channels, from 1 to 512 as on the fixture's display. [Patching](/programming/patching#patch-settings) |
| **Art-Net** | A protocol that carries DMX universes over a computer network. Studio's gateway sends it; an Art-Net node turns it back into DMX on a cable. [Outputs](/rig/outputs) |
| **Bar** | Four beats. Cue and chase durations are counted in bars, so they follow the tempo: at 120 BPM a bar lasts 2 s. [Timing](/concepts/timing) |
| **Blind** | How the cue pool programs: a click on a cue opens it without playing it, and editing a cue that isn't playing doesn't change the stage; its play button plays it. [Programming blind](/programming/scenes#programming-blind) |
| **BPM** | Beats per minute: the show's tempo, set in the toolbar or with **Tap Tempo**. [Timing](/concepts/timing) |
| **Cell** | A repeated part of a fixture with its own channels: a pixel of a bar, a head of a multi-head fixture. Scenes and effects can treat each cell on its own. [Fixture Library](/rig/fixtures#cells) |
| **Channel** | One controllable value of a fixture (a dimmer, a colour, pan), sent as a number from 0 to 255. Each channel takes one address. [Patching](/programming/patching#channels) |
| **Chase** | A timeline of a group's cues, measured in bars: each cue item plays a cue from a point, for a length. [Chases](/programming/chases) |
| **Clear** | Empties the [programmer](/programming/playback#the-programmer): the channels go back to what playback gives them, at once. Parked channels stay. |
| **Cue** | Something a group does: a scene or an effect, kept in the group's cue pool. [Show structure](/concepts/#cue) |
| **Cue item** | One entry on a chase's timeline: a cue, where it starts and how long it lasts. [Chases](/programming/chases#the-timeline) |
| **DBO** | Dead blackout: the Master column's **Blackout**. Every level goes dark at once without moving the grand master; parked channels stay. [Grand Master and DBO](/programming/playback#grand-master-and-dbo) |
| **DMX (DMX512)** | The standard language of stage lights: 512 values per universe, sent many times a second. [How Studio works](/introduction/overview) |
| **Effect** | A cue that moves channels along a waveform between a minimum and a maximum, offset from fixture to fixture. [Effects](/programming/effects) |
| **Fade** | How a cue moves into its values (**Fade in**) or out of them into what is underneath (**Fade out**), over its own time in bars, along its curve. [Scenes](/programming/scenes#fade-in-and-fade-out) |
| **Family** | What a channel does on stage: **Intensity** (dimmer, shutter, strobe), **Colour**, **Position** (pan and tilt) or **Beam** (zoom, focus, gobos, prisms, iris, frost). A cue sets one family, and a group plays one cue per family at a time; each family has its column in the cue pool. [What plays together](/concepts/timing#what-plays-together) |
| **Fixture** | One light in the show, patched at an address in a universe, in a mode. [Show structure](/concepts/#fixture) |
| **Gateway** | The small program that receives Studio's output and sends it to your lights (as Art-Net). Built into the desktop app; run on its own with the browser version. Studio connects to it, and reconnects on its own. [Outputs](/rig/outputs#_2-connect-studio-to-the-gateway) |
| **GDTF** | General Device Type Format: the file format manufacturers use to describe their fixtures, with their channels, 3D models and gobos. [Fixture Library](/rig/fixtures#gdtf-fixtures) |
| **Gobo** | A pattern placed in a beam to project a shape. The visualizer draws gobos on the floor and in the haze. [Visualizer](/interface/visualizer/#light-on-stage) |
| **Grand master** | The Master column's knob: scales every level Studio sends, after the group knobs, programmer values included. Not saved. [Grand Master and DBO](/programming/playback#grand-master-and-dbo) |
| **Group** | A set of fixtures programmed together. It owns its cues and chases, which only touch its fixtures. [Groups](/programming/groups) |
| **Haze** | Fine smoke in the air that makes beams visible. The visualizer's **Density** sets how much. [Visualizer](/interface/visualizer/#haze) |
| **Isolate** | A group button: while any group is isolated, only isolated groups' playback is sent. [Group Controls](/programming/playback#group-controls) |
| **Kept** | A colour, aim or beam the fixtures keep as it was when its cue stopped, until another cue takes that family; NOW reads "kept:" and the cue, whose row keeps its fill where it stopped. [The Cue Pool](/programming/scenes#the-cue-pool) |
| **Layer** | A cue **Mode**: the cue plays over the cue it takes over and gives it back when stopped, fading in from it and back into it. [What plays together](/concepts/timing#what-plays-together) |
| **Master** | The column on the right of the group pool: row *n* starts or stops chase *n* of every group at once. [Playing a show](/programming/playback#master-rows) |
| **Mode** (cue) | What a cue does to the cue it takes over: **Replace** or **Layer**. [Cue settings](/programming/scenes#cue-settings) |
| **Mode** (fixture) | A fixture's DMX setup: how many channels it uses and in what order. It must match the mode set on the light itself. [Fixture Library](/rig/fixtures#finding-a-fixture) |
| **NOW** | The line in each cue pool column's head: what the stage shows of that family and where it comes from (a cue, a chase's item, **kept** from a stopped cue, or **rest**). It only shows. [The Cue Pool](/programming/scenes#the-cue-pool) |
| **OFL (Open Fixture Library)** | A free, community-made library of fixture descriptions. Studio has 480 of them built in. [Fixture Library](/rig/fixtures) |
| **Park** | Locks a channel at a value above everything else (cues, the programmer, **Clear**) until you unpark it; saved with the show. [Parking a channel](/programming/playback#parking-a-channel) |
| **Patch** | Telling Studio which lights you have, at which addresses, in which universes. [Patching](/programming/patching) |
| **Phase** | Where a fixture is on an effect's waveform, in degrees. Spreading phases makes a movement travel across the rig. [Effects](/programming/effects#how-an-effect-moves) |
| **Programmer** | Where the values you set by hand in the universe view go: they win over every cue until you **Clear** them, and aren't saved. [The programmer](/programming/playback#the-programmer) |
| **Quantize** | When a chase you start actually begins: at once, or on the next bar, half bar, beat or half beat. [Chases](/programming/chases#chase-settings) |
| **Replace** | A cue **Mode** (new cues): the cue turns off the cue it takes over once faded in. [What plays together](/concepts/timing#what-plays-together) |
| **Rest** | Where a family goes when no cue holds it: Intensity back to 0 (or a GDTF fixture's home value), colour, position and beam where they are (**kept**) until another cue takes them. [What plays together](/concepts/timing#what-plays-together) |
| **Port-address** | An Art-Net universe number, written Net.Subnet.Universe (0.1.2). [Outputs](/rig/outputs#_3-route-a-universe) |
| **Route** | One universe sent through one gateway to one receiver, with its protocol and universe number. A universe can have several. [Outputs](/rig/outputs#_3-route-a-universe) |
| **sACN** | Another protocol for DMX over a network (E1.31). Not sent by the bundled gateway yet. [Outputs](/rig/outputs#what-s-verified) |
| **Scene** | A cue that brings channels to set values, with a fade. [Scenes](/programming/scenes) |
| **Showfile** | A show saved as a file (`.json`): everything you programmed, for the web and desktop versions. [Showfiles](/rig/showfiles) |
| **Universe** | A block of 512 DMX channels, sent through one output. [Show structure](/concepts/#universe) |
| **Visualizer** | Studio's 3D view of your rig, driven by the same values as your lights. [Visualizer](/interface/visualizer/) |
| **WSC (Web Show Control)** | The protocol Studio uses to talk to the gateway. You never set it: it is how Studio reaches a gateway. [Outputs](/rig/outputs#_2-connect-studio-to-the-gateway) |
