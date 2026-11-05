# Proposal: document-show-programming

Unit 3 of epic `manual-overhaul`. Depends on unit 2 (`add-manual-live-previews`).

## Why

A new user can't learn to program a show from the manual. Every `workflow/*` page says
"Documentation in progress". The `interface/` and `modifiers/` pages describe panels one by one
but never connect them into a job, and nothing explains the concepts (what a group owns, how
cues relate to chases, what bars and quantize mean).

## What Changes

- New information architecture for the sidebar, replacing Introduction / Interface / Modifiers /
  Workflow:
  - **Getting started**: Introduction (unit 1), Installation, *Your first show* (a 10-minute
    tutorial on the demo showfile), Interface tour (one page, the five regions).
  - **Concepts**: how a show is organised: show, universe, fixture, group, cue (scene / effect),
    chase, master, Live clock (BPM, bars, quantize).
  - **Programming a show**: Patching, Groups, Scenes (fixtures, channels, colour picker,
    pan/tilt, fade curves, cells), Effects (waveforms, frequency, phase, spread, spread over
    fixtures/cells, presets), Chases (timeline, quantize, loop/one-shot, BPM sync),
    Playback (triggering toggle/temporary, master, play/pause/stop, tap tempo).
  - **Rig & output** and **Reference**: placeholders that unit 4 fills.
- Each page follows the skill `user-manual` style: what it is, a live preview, step-by-step
  actions, a settings table with units and ranges, notes for surprising behaviour.
- The old `interface/*`, `modifiers/*` and `workflow/*` URLs keep a short stub that links to the
  new page, so external links don't 404.
- Videos covered by a preview are deleted from `public/interface/`.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `user-manual`: add requirements for content coverage of show programming, the information
  architecture, and redirect stubs.

## Impact

- Code: `docs/manual/**` (pages, sidebar in `.vitepress/config.js`, preset registry additions),
  `docs/manual/public/interface/*` (deletions). App code: none.
- Showfile format: none. Unsaved marker: none. Live playback/timing: none. WSC output: none.
  Visualizer: none. Web vs Electron: none.
- Manual: this unit *is* manual content: every page under Getting started, Concepts and
  Programming a show.

## Out of scope

- Fixture library, GDTF, outputs, visualizer, showfiles, desktop app, reference pages (unit 4).
- Behaviour changes in the app. Bugs found while documenting go to the epic's backlog or
  their own change.
- Translations.
