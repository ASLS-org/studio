# What is ASLS Studio

ASLS Studio is open-source lighting control software with a real-time 3D visualizer. You use it
to patch DMX fixtures, program looks and effects, sequence them in time with the music, and
play the show live, either on real lights or on screen. It runs in a web browser or as a desktop
app for macOS, Windows and Linux.

::: tip Try it first
Studio runs in the browser with nothing to install. See [Installation](/introduction/installation)
for the web and desktop options, then come back here for a tour.
:::

## Who it's for

- **Lighting operators and designers** running bands, clubs, theatre and events with a small to
  medium rig.
- **Venues, schools and community spaces** that want a capable console without a licence fee.
- **Artists and makers** building installations, where a plain-JSON showfile is easy to generate
  or script.
- **Learners** who want to understand DMX, groups, cues and chases by trying them, with the 3D
  visualizer standing in for real fixtures.

## What you can do with it

| You want to… | Studio gives you | Read |
|---|---|---|
| Set up your rig | Fixtures from the Open Fixture Library or your own GDTF files, patched across several DMX universes, each fixture with a 3D position | [Patching fixtures](/workflow/patching/) |
| Organise fixtures | Groups, each with its own pool of cues | [Setting up groups](/workflow/grouping/) |
| Build looks | **Scenes**: static channel values with fade-in and fade-out curves | [Creating scenes](/workflow/scenes/) |
| Make things move | **Effects**: waveforms on any channel, with frequency, phase and spread across fixtures or cells | [Creating effects](/workflow/effects/) |
| Sequence a song | **Chases**: cues on a timeline measured in bars, quantized and synced to the BPM | [Chase modifier](/modifiers/chase/) |
| Play it live | Trigger cues and chase rows, set or tap the tempo, play, pause and stop | [Triggering cues](/workflow/triggering/) |
| See it without the rig | A real-time 3D visualizer with beams, colours, gobos and movement | [Visualizer](/interface/visualizer/) |
| Drive real lights | Output to Art-Net, sACN or USB DMX interfaces through the WSC gateway | [How Studio works](/introduction/overview#from-studio-to-your-lights) |
| Keep your work | Showfiles in plain JSON, saved in the browser and exportable | [How Studio works](/introduction/overview#saving-your-show) |

## Where to start

1. Get Studio running: [Installation](/introduction/installation).
2. Learn how a show is organised: [How Studio works](/introduction/overview).
3. Find your way around the screen: [Toolbar](/interface/toolbar/),
   [Patch Bay](/interface/patchbay/), [Group Pool](/interface/grouppool/),
   [Visualizer](/interface/visualizer/) and [Modifier](/interface/modifier/).

::: warning Beta software
Studio is in beta. Features can change between releases and some rough edges remain. Please
report problems on the project's <ResourceLink to="issues">issue tracker</ResourceLink>, and
ask questions in the <ResourceLink to="discussions">discussions</ResourceLink>.
:::

## Open source

Studio is free software under the [GNU General Public License v3](/introduction/license). The
source code is on <ResourceLink to="repository">GitHub</ResourceLink>, and contributions are
welcome.
