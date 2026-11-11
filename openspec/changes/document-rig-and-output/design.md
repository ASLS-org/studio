# Design: document-rig-and-output

Unit 4 of epic `manual-overhaul`. Refined on 2026-11-11, after unit 3 (show programming) set the
page style, the demo rig and the preview kit (stage demos, illustrations, one preview at a time).

## Context

The sources of truth for behaviour are:
- skills `wsc-output`, `fixture-library` and `run-studio`;
- `src/electron/CLAUDE.md` and `src/plugins/visualizer/CLAUDE.md`;
- the archived GDTF epic changes;
- the app itself. Every label and behaviour is checked in the running app before it is
  written.

What exists today:
- **Rig & output** holds two pages. `interface/visualizer` was rewritten in unit 3.
  `interface/toolbar` is an old page in the old voice ("Navigation Menu").
- `introduction/installation` is mostly developer setup ("From source", dev server), which the
  manual must not hold.
- The patching page carries the GDTF import, the missing-fixtures prompt and the channel-type
  table.

Facts that shape the pages:
- The toolbar menus are File (**New Showfile** Shift+N, **Load Showfile** Ctrl+O, **Save
  Showfile Locally** Ctrl+S, **Export Showfile** Ctrl+Shift+S), Preferences (**Visualizer**
  Ctrl+Shift+V, **Outputs** Ctrl+Shift+O) and About (Manual, License, Credits, Contact).
- The About → Manual entry opens a hard-coded URL; it is noted as an app issue, not changed here.
- The standalone visualizer is the route `/visualizer`.
- Other keys: lists take Delete/Backspace and Escape; popups take Enter and Escape; the
  visualizer takes T, R, H and Escape; number fields take the arrow keys; the colour picker takes
  arrow keys (Shift for 10× steps).
- Output, per `wsc-output` § Known issues (2026-11-03), has problems users will hit:
  - a universe's output settings aren't saved with the show;
  - packets may lack the flags the gateway needs to forward;
  - interface parameters (baud, priority, port index) are ignored;
  - deleting an output, or loading a show once one exists, can throw.

  None of this is fixed here (out of scope).
- Save is manual. **Save Showfile Locally** keeps the show in the browser's storage (the desktop
  app's for the desktop build); **Export Showfile** downloads a file. On first run the demo
  showfile loads.

## Goals / Non-Goals

**Goals:**
- A reader can go from a patched show to real lights.
- They can bring in their own fixtures, keep and move their shows, and install the desktop app.
- They can look up any shortcut, term or problem.

**Non-Goals:**
- Fixing output bugs, the hard-coded Manual URL, or other app behaviour.
- Developer docs: building from source moves out of the user manual.

## Decisions

### D1. Page map (revised after review, 2026-11-12)
| Section | Pages |
| --- | --- |
| Getting started | About, How Studio Works (a short narrative linking each topic), Installation (browser or desktop, **including the desktop app**: downloads, first launch, built-in gateway), Your First Show (steps only, linking the pages with the demos), The Interface (the map, **including the toolbar**) |
| Concepts | Show Structure (definitions + demo-show facts, links instead of previews), Timing (units only) |
| Programming a show | unchanged |
| Rig & output | Fixture Library (`rig/fixtures`), Visualizer, Outputs (`rig/outputs`), Showfiles (`rig/showfiles`) |
| Reference | Shortcuts, Glossary, Troubleshooting, Known Limitations (`reference/*`) |

`interface/toolbar` becomes a one-line stub to The Interface (old URL). The separate Desktop App
page, never published, merged into Installation.

### D8. One home per topic (revised after review)
Each topic is explained once, on its home page, with its live preview or illustration. Other pages
summarise it in a sentence and link there. Every preset and illustration appears on exactly one
page. Whole-panel previews that repeat the widgets shown one by one are dropped; one panel, the
group view, stays on The Interface as the modifier strip's example. Known-limitation notes stay
where the reader hits the problem, as one line linking Known Limitations.

### D9. One floating visualizer per page (revised after review)
The visualizer is no longer drawn inside each stage preview: the page has one floating card
(`FloatingVisualizer.vue`, in the layout), shown on pages with stage previews.
- **Docked:** small, bottom right, while no stage preview runs.
- **Attached:** while one runs, the card floats beside it, in the right margin first, else the
  left, else above or below it, and follows it as the page scrolls.
- **Moved and resized:** the reader can drag it by its title (it stays put until sent back) and
  resize it from its corner, within limits.
- **Collapsed:** **–** reduces it to a title pill with "Show the stage", releasing the 3D view.
- **Phones:** a bottom sheet.

Collapsed and sizes are kept in the browser's storage. Stage previews are now the component's
size; `StageWrap` keeps only the component box and the in-box popup host. The standalone
`visualizer` preset is gone: the card is the visualizer.

### D2. User terms, not protocol terms
"The gateway is a small program that turns Studio's output into Art-Net, sACN or DMX on a USB
interface." No packet fields, ports only where the user must type them.

### D3. Previews follow unit 3's rules
- Live where harmless: the Visualizer preferences next to the stage (haze, brightness and
  exposure change the rig live); the toolbar's menus as demos.
- Output widgets only as demos that point and never connect (the skill forbids anything
  interactive that connects).
- Concepts as illustrations: a diagram from Studio to the gateway to the interface to the lights.
- No screenshots or recordings of the app. OS steps (first launch on macOS, Windows, Linux) are
  text.

### D4. Verified, or said so
Every shortcut and label is checked in the running app. Output steps are verified with the
bundled gateway and an Art-Net monitor on this machine. Hardware setups that couldn't be tested
(USB DMX interfaces, sACN nodes) are listed as not yet verified in Known limitations, not
described as working.

### D5. Troubleshooting as symptom → cause → fix
Cases come from the output known issues, GDTF import errors, the missing-fixtures prompt, browser
storage being cleared, WebGL being unavailable, and the desktop app's first-launch warnings. They
are phrased as what the user sees.

### D6. Downloads through `<ResourceLink to="download">`
No per-OS asset URLs: they change every release.

### D7. Known limitations collects the epic backlog
The Studio bugs found while documenting (epic backlog) and the output issues, phrased as what
doesn't work yet and the workaround. Feature pages link there instead of repeating notes.

## Risks / Trade-offs

- **No hardware at hand:** document what was verified with the gateway and a monitor; the rest is
  marked not yet verified (D4).
- **Output bugs make the Outputs page frustrating to follow:** state the workaround (re-enter a
  universe's connection after opening a show) at the step where it bites, and in Troubleshooting.
- **Desktop builds differ per OS (unsigned builds, Gatekeeper, SmartScreen):** generic, accurate
  text ("your system may warn that the app is from an unidentified developer…") with how to open
  it anyway; no screenshots.
- **Moving the developer setup out:** the developer docs don't cover it yet. The repository
  README holds build steps, and the page links it.
