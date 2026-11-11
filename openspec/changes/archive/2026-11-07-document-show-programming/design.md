# Design: document-show-programming

See proposal.md for the why. Refined on 2026-11-06 on branch `docs/document-show-programming`,
after units 1 and 2 shipped. The user chose to keep this unit whole (one branch, one PR).

## Context

- **Current pages:**
  - `introduction/*` (unit 1): About, How Studio works, Installation, License;
  - `interface/{toolbar,patchbay,grouppool,visualizer,modifier}`;
  - `modifiers/{universe,group,chase}`: the richest, now with live previews and demos from unit 2;
  - `workflow/patching`, plus five empty `workflow/*` stubs.
- **How Studio works** (`introduction/overview.md`) already introduces the model at a high
  level: a show from rig to playback, time counted in bars, the screen, output, saving, web or
  desktop. Concepts go deeper and must not repeat it.
- **Live previews and demos** (unit 2) cover every modifier widget and panel. The registry is in
  `.vitepress/theme/previews/presets.js`, with the demo show's ids listed at its top.
- **Facts checked in the code** (2026-11-06), to verify in the app while writing:
  - **Cue settings**: Name, Color, Loop Style (One Shot / Loop), Trigger Style
    (Toggle / Temporary), Start (Absolute / Relative), Duration in **bars** (the duration times
    the bar length at the current BPM).
  - **Effect tool**:
    - Waveform (Sine, Triangle, Square, PWM);
    - Min / Max (DMX 0–255), Freq (1–100), Phase;
    - Direction (left to right, right to left, bounce both ways, symmetric);
    - Spread over (Fixtures / Cells), Phase start / stop (−360° to 360°).
  - **Presets**:
    - Zoom, Dimmer;
    - Pan & tilt: Line, Circle, Eight, Pan, Tilt;
    - Color: Hue shift, and Red / Green / Blue intensity.
  - **Chase**: Name, Duration (bars), Color, Quantize (None, 1/8, 1/4, 1/2, 1/1),
    Trigger (Loop, One Shot).
    - A chase is created by double-clicking an empty chase slot of a group in the group pool.
    - The timeline places cue items on a bar grid.
  - **Group pool**:
    - per group: a dimmer knob (0–255), **Isolate** (solo) and **Blackout**;
    - the **Master** column plays chase row *n* across every group.
  - **Cue pool**:
    - a click on the body plays or stops a cue; a click on the footer selects it for editing;
    - double-clicking an empty slot opens *Add cue*;
    - Delete / Backspace deletes the selected cue.
  - **Toolbar transport**: BPM field, play state (stopped / playing / paused), Tap Tempo.
- **Studio bugs known before writing** (unit 2):
  - Shift+click range selection in the patch bay selects nothing;
  - opening a scene of a group whose fixtures aren't the show's first throws (the panel goes on);
  - the patch bay's **New** button does nothing.

## Goals / Non-Goals

**Goals:**
- A reader with no lighting software background can program a show from the manual alone,
  following the pages in order.
- Every control on the modifier, patch bay and group pool panels is named and explained
  somewhere, with its unit and range.

**Non-Goals:**
- Rewriting Toolbar and Visualizer (unit 4), or the introduction pages (unit 1).
- Documenting planned behaviour.

## Decisions

### D1. Task-first pages, panels as sections
Readers come with a job ("make a colour chase"), not a panel name. Each Programming page is a
task. The widget reference sits inside it under `##` headings that use the UI's exact labels, so
search finds widgets by name. *The interface* is the only panel-by-panel page, as an orientation
tour, and it links to the task pages.

### D2. Structure and URLs
| Section | Pages (URL) |
|---|---|
| Getting started | About `/introduction/`, How Studio works `/introduction/overview`, Installation `/introduction/installation`, Your first show `/getting-started/first-show`, The interface `/getting-started/interface` |
| Concepts | Show structure `/concepts/`, Timing and playback `/concepts/timing` |
| Programming a show | Patching fixtures `/programming/patching`, Groups `/programming/groups`, Scenes `/programming/scenes`, Effects `/programming/effects`, Chases `/programming/chases`, Playing a show `/programming/playback` |
| Rig & output | Toolbar `/interface/toolbar/`, Visualizer `/interface/visualizer/` (unchanged; unit 4) |
| | License `/introduction/license` stays last in Getting started |

Unit 1's URLs stay, so the home page and the existing links don't change. Section icons and
colours come from `shell/nav.js` (one accent per section).

### D3. Stubs for moved pages
These old pages become a stub: the title, one sentence ("This page moved to …"), and a link.
VitePress has no server redirects on a static host, so stubs are the portable choice.
- `interface/patchbay` → The interface (patch bay section) and Patching fixtures;
- `interface/grouppool` → Groups and Playing a show;
- `interface/modifier` → The interface;
- `modifiers/universe` → Patching fixtures;
- `modifiers/group` → Groups, Scenes and Effects;
- `modifiers/chase` → Chases;
- `workflow/patching` → Patching fixtures;
- `workflow/grouping` → Groups;
- `workflow/scenes` → Scenes;
- `workflow/effects` → Effects;
- `workflow/triggering` → Playing a show;
- `workflow/environment` → Installation.

Stubs are left out of the sidebar. They are removed in a later release.

### D4. Previews over media, reusing unit 2
Each page uses the presets that already exist, and their existing content moves into the new
pages, rewritten task first. New presets only where a widget is discussed without one:
- a group pool demo for Isolate / Blackout / the dimmer knob;
- a master row demo;
- a chase timeline demo that adds a cue item;
- a scene relative-start demo, if the behaviour is visible.

No new screenshots or recordings.

### D5. Your first show
- **Starting point:** a blank show, made with File → New Showfile in Studio.
- **Steps:** patch two PARs and the MAC Aura; make a group; one scene; one effect from a preset;
  a two-cue chase; play it.
- **Each step** gives the exact clicks and a preview or demo of that step on the demo show. It
  states what you should see, and ends with a link to the full page.
- **Length:** about ten minutes for a first-time reader.

### D6. Grounded writing
- **Before writing a page,** the author walks its feature in `npm start` with the manual demo
  show. They note labels, defaults, ranges and units, plus anything surprising.
- **Broken behaviour is left out of the steps.** It is listed in the PR and in the epic backlog,
  with a short note on the page only where readers would otherwise get stuck.
- **Example:** the patch bay's Shift+click is not documented until it works. The current text
  claiming it goes.

### D7. Checks
- **Links:** the manual build fails on dead links (VitePress default; only `localhostLinks` are
  ignored), so every new link and stub is checked.
- **Previews:** a headless pass over every new page checks that each preview is ready and that
  nothing overflows.
- **Labels:** a grep of each page's bold labels against `src/views` catches renamed controls.

## Risks / Trade-offs

- **The PR is long (mostly prose).** → The tasks commit page by page, so review can follow the
  commits.
- **Behaviour that's about to change** (the spreading model, cell selection; see the GDTF epic
  backlog). → Document what ships now, with a `> **Note:**` where a redesign is planned. No
  dates.
- **Stubs add pages that the search indexes.** → Keep stubs to one sentence so they rank below
  the real page.

## Revision after review (2026-11-07)

- **Concepts** gets the demo show as a running example: `<ShowMap />` draws it from its showfile,
  and each term has an "In the demo show" example with a preview.
- **Scenes and effects** are shown on stage, not just as widgets. Each page gets a cue pool and the
  visualizer side by side (`scene-stage`, `effect-stage`, `pixel-stage`), with a cursor playing
  the cues. Each page also gets an animated diagram of what happens: `<SceneFade />` for a fade
  and its Start, `<EffectWave />` for waveforms and phase spread.
- **Visualizer preview**: High quality instead of Guides. The preview's box takes Studio's size,
  which fixes a cropped, off-centre view. The camera is set in front of the rig.
- **Demo show**:
  - every fixture hangs from a truss, pointing down;
  - cue and group colours come from Studio's palette (no Custom);
  - Circle's range is narrowed to 100–156. The full 0–255 preset threw hung heads to their limits,
    and Studio applies an effect's start values once when a show loads.


## Second revision after review (2026-11-11)

- **Demo show = the home page's rig.** Four MAC Aura hung 6 m up, one group *Rig*, cues *Warm
  wash*, *Rainbow*, *Ballyhoo*, *Sunset*, chase *Story* (8 bars). Its scenes start Relative, so
  they cross-fade. The pixel bar left with the old show, so `<CellsBar />` explains cells.
- **One preview at a time.** `LivePreview` runs only the preview most in view (or the one
  clicked); the others are unmounted and show a dimmed, labelled pause. Memory and WebGL contexts
  stay bounded on long pages.
- **Demos run to the end, on stage.** Every demo that changes the rig sits next to the
  visualizer (`StageWrap`) and ends on the visible result. Captions explain what happens and why,
  in the frame's bar. Each loop reloads the show. Presets gain `start`, `onRoute` and handler
  props, for what a parent panel would do.
- **Visualizer previews:**
  - they take what they added out of Studio's shared scene on unmount (no duplicated rigs);
  - they frame the whole stage for their box and turn auto-focus off;
  - the WebGL probe runs once per page.
- **No recordings.** The visualizer page's three videos and the preview's fallback video are gone.
  The page is rewritten around the previews.
- **Live demo link.** `MANUAL_URL_DEMO` is set (demo.studio.asls.timekadel.com), so the nav, the
  toolbar and the hero show it. Pages link it where they invite readers to try something.
- **Patch bay delete demo dropped.** Deleting from the patch bay does nothing in Studio (epic
  backlog), so the manual deletes from the universe view's fixture pool.
