# Glossary

The terms this manual uses, in alphabetical order.

| Term | Meaning |
| --- | --- |
| **Address** | Where a fixture listens in its universe: the first of its channels. Studio counts from 0, so address 0 is the one a fixture's display calls 1. [Patching](/programming/patching#patch-settings) |
| **Art-Net** | A protocol that carries DMX universes over a computer network. Studio's gateway sends it; an Art-Net node turns it back into DMX on a cable. [Outputs](/rig/outputs) |
| **Bar** | Four beats. Cue and chase durations are counted in bars, so they follow the tempo: at 120 BPM a bar lasts 2 s. [Timing](/concepts/timing) |
| **BPM** | Beats per minute: the show's tempo, set in the toolbar or with **Tap Tempo**. [Timing](/concepts/timing) |
| **Cell** | A repeated part of a fixture with its own channels: a pixel of a bar, a head of a multi-head fixture. Scenes and effects can treat each cell on its own. [Fixture Library](/rig/fixtures#cells) |
| **Channel** | One controllable value of a fixture (a dimmer, a colour, pan), sent as a number from 0 to 255. Each channel takes one address. [Patching](/programming/patching#channels) |
| **Chase** | A timeline of a group's cues, measured in bars: each cue item plays a cue from a point, for a length. [Chases](/programming/chases) |
| **Cue** | Something a group does: a scene or an effect, kept in the group's cue pool. [Show structure](/concepts/#cue) |
| **Cue item** | One entry on a chase's timeline: a cue, where it starts and how long it lasts. [Chases](/programming/chases#the-timeline) |
| **DMX (DMX512)** | The standard language of stage lights: 512 values per universe, sent many times a second. [How Studio works](/introduction/overview) |
| **Effect** | A cue that moves channels along a waveform between a minimum and a maximum, offset from fixture to fixture. [Effects](/programming/effects) |
| **Fade** | How a scene moves from its start values to its values, over its duration, along its fade curve. [Scenes](/programming/scenes#fade-in) |
| **Fixture** | One light in the show, patched at an address in a universe, in a mode. [Show structure](/concepts/#fixture) |
| **Gateway** | The small program that receives Studio's output and sends it to your lights (as Art-Net). Built into the desktop app; run on its own with the browser version. [Outputs](/rig/outputs) |
| **GDTF** | General Device Type Format: the file format manufacturers use to describe their fixtures, with their channels, 3D models and gobos. [Fixture Library](/rig/fixtures#gdtf-fixtures) |
| **Gobo** | A pattern placed in a beam to project a shape. The visualizer draws gobos on the floor and in the haze. [Visualizer](/interface/visualizer/#light-on-stage) |
| **Group** | A set of fixtures programmed together. It owns its cues and chases, which only touch its fixtures. [Groups](/programming/groups) |
| **Haze** | Fine smoke in the air that makes beams visible. The visualizer's **Density** sets how much. [Visualizer](/interface/visualizer/#haze) |
| **Master** | The column on the right of the group pool: row *n* starts or stops chase *n* of every group at once. [Playing a show](/programming/playback#master-rows) |
| **Mode** | A fixture's DMX setup: how many channels it uses and in what order. It must match the mode set on the light itself. [Fixture Library](/rig/fixtures#finding-a-fixture) |
| **OFL (Open Fixture Library)** | A free, community-made library of fixture descriptions. Studio has 480 of them built in. [Fixture Library](/rig/fixtures) |
| **Patch** | Telling Studio which lights you have, at which addresses, in which universes. [Patching](/programming/patching) |
| **Phase** | Where a fixture is on an effect's waveform, in degrees. Spreading phases makes a movement travel across the rig. [Effects](/programming/effects#how-an-effect-moves) |
| **Quantize** | When a chase you start actually begins: at once, or on the next bar, half bar, beat or half beat. [Chases](/programming/chases#chase-settings) |
| **sACN** | Another protocol for DMX over a network (E1.31). Not available with the current gateway yet. [Outputs](/rig/outputs#what-s-verified) |
| **Scene** | A cue that brings channels to set values, with a fade. [Scenes](/programming/scenes) |
| **Showfile** | A show saved as a file (`.json`): everything you programmed, for the web and desktop versions. [Showfiles](/rig/showfiles) |
| **Stream** | A universe being sent through an output: its protocol and the device's address. [Outputs](/rig/outputs#_3-send-a-universe) |
| **Universe** | A block of 512 DMX channels, sent through one output. [Show structure](/concepts/#universe) |
| **Visualizer** | Studio's 3D view of your rig, driven by the same values as your lights. [Visualizer](/interface/visualizer/) |
| **WSC (Web Show Control)** | The protocol Studio uses to talk to the gateway. You only see it as a connection's **Type / Protocol**. [Outputs](/rig/outputs#_2-connect-studio-to-the-gateway)  |
