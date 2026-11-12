# Tasks

## 1. Structure

- [x] 1.1 Add the **Reference** sidebar section and the new Rig & output pages to
  `.vitepress/config.js` (D1 order); leave one-line stubs where content moves. Verify: the dev
  server shows the sections in order, with no dead links (`docs:manual:build`).
- [x] 1.2 Rewrite `introduction/installation` as a short "browser or desktop" page that links
  Desktop App and the repository README for building from source; no developer steps left.
  Verify: the page reads as a user page, links resolve.

## 2. Fixtures

- [x] 2.1 Write `rig/fixtures`: the Open Fixture Library list (sections, search, modes), GDTF
  import (button and drop), the local GDTF library and what clears it, the bundled generic
  fixtures, the missing-fixtures prompt (both choices), fixtures in 3D (generated parts, GDTF
  models, quality levels), cells, and the channel-type table. Verify each label in the patch
  popup of the running app (`npm start`), including an import of a bundled `.gdtf` file.
- [x] 2.2 Point `programming/patching` at `rig/fixtures` for those topics instead of repeating
  them. Verify: no topic is explained twice; anchors from other pages still resolve.

## 3. Outputs

- [x] 3.1 Add a Studio → gateway → interface/node → lights illustration (theme component, tokens
  only, still for reduced motion). Verify on the outputs page in dark and light.
- [x] 3.2 Add demo presets for **Preferences → Outputs** and a universe's connection settings
  that point at each field and never connect. Verify on `/_dev/previews`: each demo reaches its
  end and nothing connects.
- [x] 3.3 Write `rig/outputs`: the gateway (desktop: built in; browser: run it), adding and
  connecting an output, its states, sending a universe (protocol, interface, address and their
  options under exact labels), checking the lights answer, and what was verified (D4). Verify
  with Electron or a local gateway and an Art-Net monitor: the documented steps produce traffic,
  or the page says where they don't.

## 4. Visualizer, showfiles, desktop, toolbar

- [x] 4.1 Add a Visualizer preferences preset next to the stage (haze, brightness, exposure,
  quality act on the rig live) and document **Preferences → Visualizer** and the standalone view
  (`/visualizer`, for a second screen) on `interface/visualizer`. Verify both in the running app
  and the preview on the page.
- [x] 4.2 Write `rig/showfiles`: New (templates), Load, Save Showfile Locally (where it's kept,
  what clears it), Export, the unsaved `*`, the demo show on first run, older showfiles, moving a
  show to another computer (with GDTF fixtures). Verify each step in the running app, including
  reloading after a local save.
- [x] 4.3 Write `rig/desktop`: downloads per OS through the releases link, first launch on macOS,
  Windows and Linux (unsigned-app warnings, in text), the bundled gateway, differences from the
  browser. Verify against `electron-builder.yml` and `src/electron/main.js`.
- [x] 4.4 Rewrite `interface/toolbar`: menus and their shortcuts, show name and unsaved `*`, the
  clock; toolbar demos where they help. Verify every entry in the running app.

## 5. Reference

- [x] 5.1 Write `reference/shortcuts`: every key and mouse binding Studio responds to, with where
  it applies. Verify each one in the running app; drop any that don't work (list them in Known
  limitations if they're shown in the UI).
- [x] 5.2 Write `reference/glossary`: the terms the manual uses, one or two sentences each, with
  a link to the page that explains them. Verify every link.
- [x] 5.3 Write `reference/troubleshooting`: symptom → cause → fix tables (outputs, fixtures and
  GDTF, saving, visualizer and WebGL, desktop first launch) and a short FAQ. Verify each fix is
  the one the app needs.
- [x] 5.4 Write `reference/limitations`: the epic backlog's Studio bugs and the output known
  issues as what doesn't work yet and the workaround; feature pages link here instead of
  repeating notes where that reads better. Verify each item against the app.

## 6. Checks and context

- [x] 6.1 Regenerate `_dev/previews.md`; run the page checks at 1280 and 375 px (previews
  running one at a time, no errors, no horizontal overflow) on every new or changed page.
- [x] 6.2 `npm run docs:manual:build` passes with no unknown-preset or dead-link warnings.
- [x] 6.3 Update skill `user-manual` (page map, Reference section, output docs rules) and
  `docs/manual/CLAUDE.md` if the structure note changes; update the epic doc's status.
- [x] 6.4 npx eslint on all touched files is clean.

## 7. Revision after review (2026-11-12)

- [x] 7.1 One floating visualizer per page (`FloatingVisualizer.vue`, `previews/stage.js`,
  `host.mountVisualizer`): docked, attached, moved, resized, collapsed; stage previews drop their
  own visualizer. Verify: headless Chrome at 1280, 1600 and 390 px (attached beside the running
  demo, collapsed releases the WebGL context, drag frees it).
- [x] 7.2 One home per topic: every preset and illustration on one page (usage map), panel
  previews that repeat widgets dropped, unused presets removed. Verify: the usage map shows no
  duplicates.
- [x] 7.3 Structure: desktop app into Installation, toolbar into The Interface (stub), overview
  and timing trimmed to what's theirs. Verify: all pages pass the checks at 1280 and 375 px, all
  anchored links resolve, `docs:manual:build` passes.
- [x] 7.4 Update skill `user-manual` and `docs/manual/CLAUDE.md` for the card and the one-home
  rule.
