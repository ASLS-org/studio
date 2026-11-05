# Design (draft): document-show-programming

Draft written with the epic plan on 2026-11-05. Refine in the unit branch before writing the specs
and tasks.

## Context

Current pages: `interface/{toolbar,patchbay,grouppool,visualizer,modifier}`,
`modifiers/{universe,group,chase}` (the most complete, using `<Video>`), and six empty
`workflow/*` stubs. Engine concepts are listed in `openspec/config.yaml` (context vocabulary) and
`src/models/DMX/CLAUDE.md`. Master (`master.model.js`) exists in the engine. Its UI exposure has to
be checked before it gets documented.

## Decisions (draft)

### D1. Task-first pages, panels as sections
Readers come with a job ("make a colour chase"), not a panel name. Each Programming page is a
task. The panel and widget reference sits inside it under `##` headings that use the UI's exact
labels, so search still finds them by name.

### D2. Ground every claim in the running app
Before writing a page, the author walks the feature in `npm start` with the demo showfile and
notes labels, defaults, ranges and units (bars, BPM, DMX 0–255, degrees). Things that turn out
broken are reported, not documented as working.

### D3. Folder layout and stubs
`getting-started/`, `concepts/`, `programming/<task>/`. Old pages become 3-line stubs ("This page
moved to …" plus a link). VitePress has no server redirects on a static host, so stubs are the
portable choice. They're removed in a later release.

### D4. Previews over media
Use a preset from unit 2 wherever a widget is discussed. A missing preset gets added to the
registry in this unit. A `<Video>` or screenshot only for flows across regions (dragging a
fixture from the patch bay into a group), named per skill `user-manual`.

## Risks / Trade-offs

- [Documenting behaviour that is about to change (spreading model, cell selection: see the GDTF
  epic backlog)] → document what ships now, with a short `> **Note:**` where a known redesign is
  planned. Don't promise dates.
- [Long unit] → can split during refinement into `concepts + getting started` and `programming`
  if the PR gets too large to review.
