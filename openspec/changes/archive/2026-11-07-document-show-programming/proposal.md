# Proposal: document-show-programming

Unit 3 of epic `manual-overhaul`. Depends on unit 2 (`add-manual-live-previews`, archived: live
previews and demos, `<LivePreview preset>`).

## Why

A new user can't learn to program a show from the manual:
- Five of the six `workflow/*` pages say "Documentation in progress".
- The `interface/` and `modifiers/` pages describe panels one by one but never connect them into
  a job.
- Nothing explains how cues relate to chases, what a group owns, or what bars, quantize and the
  trigger styles do.

## What Changes

- **A new sidebar, by the reader's path:**
  - **Getting started**: About, How Studio works and Installation (unit 1, unchanged URLs), plus
    two new pages:
    - *Your first show*: a tutorial from a blank show to a playing chase;
    - *The interface*: a tour of the five regions.
  - **Concepts**:
    - *Show structure*: show, universe, fixture and cells, group, cues (scene / effect), chase,
      master;
    - *Timing and playback*: the Live clock, BPM and tap tempo, bars, quantize, play / pause /
      stop, trigger and loop styles.
  - **Programming a show**, one page per task:
    - *Patching fixtures*: universes, the patch popup, fixture settings and position, trying a
      fixture with its channels, colour, pan/tilt and cells;
    - *Groups*;
    - *Scenes*: fixtures, channels, colour, pan/tilt, cells, fade curves, relative scenes;
    - *Effects*: modulated channels, presets, waveforms, min/max, frequency, phase, direction,
      spread over fixtures or cells;
    - *Chases*: the timeline, duration, quantize, loop / one-shot;
    - *Playing a show*: triggering cues and chases, toggle / temporary, master rows, group
      dimmer, Isolate, Blackout.
  - **Rig & output**: the current Toolbar and Visualizer pages, unchanged until unit 4 rewrites
    them.
- **Page style**: each page follows skill `user-manual`, written task first:
  - what it is and why;
  - live previews and demos from unit 2 (new presets where a widget isn't covered);
  - step-by-step actions using the UI's exact labels;
  - settings tables with units and ranges (bars, BPM, DMX 0–255, degrees);
  - notes for surprising behaviour.
- **Grounded in the running app**: every label, default, range and behaviour is checked in
  Studio. Behaviour that doesn't work is left out of the steps and listed in the PR rather than
  documented.
- **Old URLs stay**: `interface/{patchbay,grouppool,modifier}`, `modifiers/{universe,group,chase}`
  and `workflow/*` become short "This page moved" stubs linking to the new page, so external
  links keep working.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `user-manual`: adds requirements for the reader-path structure, end-to-end show programming
  coverage, the first-show tutorial, the stubs for moved pages, and documentation that matches
  the app.

## Impact

- Code: `docs/manual/**`:
  - pages;
  - the sidebar in `.vitepress/config.js`;
  - preset registry additions in `.vitepress/theme/previews/presets.js`.
- App code: none.
- Showfile format: none. Unsaved marker: none. Live playback/timing: none. WSC output: none.
  Visualizer: none. Web vs Electron: none.
- Manual: this unit *is* manual content.

## Out of scope

- Fixture library and GDTF import, outputs and the gateway, the visualizer, showfiles, the
  desktop app, shortcuts, glossary and troubleshooting (unit 4).
- Behaviour changes in the app. Bugs found while documenting go to the epic's backlog or their
  own change.
- Translations.
