# Proposal: document-rig-and-output

Unit 4 of epic `manual-overhaul`. Depends on unit 2. Can run beside unit 3, but it lands into the
sidebar structure unit 3 introduces.

## Why

Recent epics added GDTF import, fixture models and cells, a new visualizer with render settings,
WSC outputs with a bundled gateway, and a desktop app. None of that is in the manual, so users
can't connect Studio to real lights, bring in their own fixtures or install the desktop build.
There's also no shortcut list, glossary or troubleshooting page.

## What Changes

- **Rig & output** section:
  - *Fixture library*: browsing and searching the built-in Open Fixture Library, modes,
    preferences, the missing-fixtures prompt on load.
  - *GDTF fixtures*: importing `.gdtf` files, the local GDTF library, the generic fixtures,
    what's supported and what isn't.
  - *Fixture models and cells*: how fixtures appear in 3D, multi-cell fixtures and per-cell
    control.
  - *Outputs and the gateway*: what WSC and the gateway are (in user terms), adding a
    connection, assigning universes, protocols and transports (Art-Net, sACN, DMX512, OSC over
    UDP/TCP/USB/serial as offered by the UI), troubleshooting a silent rig.
  - *Visualizer*: navigation (orbit, pan, zoom), positioning fixtures, the visualizer
    settings (look, render resolution), the standalone visualizer view for a second screen,
    performance tips.
  - *Showfiles*: new, open, save, save as, export, autosave in the browser, the demo show,
    opening older showfiles.
  - *Desktop app*: downloads per OS, first launch, the bundled gateway, differences from the
    web version.
- **Reference** section: keyboard and mouse shortcuts, preferences, glossary, troubleshooting
  and FAQ, known limitations.
- Live previews from unit 2 where they apply (connection widget, fixture settings, position
  tool); screenshots for OS-level steps.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `user-manual`: add content-coverage requirements for rig, output, visualizer, showfiles,
  desktop app and reference.

## Impact

- Code: `docs/manual/**`, preset registry additions. App code: none.
- Showfile format: none. Unsaved marker: none. Live playback/timing: none. WSC output: none
  (documented, not changed). Visualizer: none. Web vs Electron: none. Both are documented, with
  differences stated.
- Manual: this unit *is* manual content: every page under Rig & output and Reference.

## Out of scope

- Developer-facing protocol details (packet layouts, WSC SDK). Those belong in the developer
  docs.
- Fixing known WSC output bugs (skill `wsc-output` § Known issues). The ones users hit go to
  Troubleshooting or Known limitations.
- Writing new fixture definitions.
