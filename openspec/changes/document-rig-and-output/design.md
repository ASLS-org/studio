# Design (draft): document-rig-and-output

Draft written with the epic plan on 2026-11-05. Refine in the unit branch before writing the specs
and tasks.

## Context

The sources of truth for behaviour are skills `wsc-output`, `fixture-library` and `run-studio`,
`src/electron/CLAUDE.md`, `src/plugins/visualizer/CLAUDE.md`, and the archived GDTF epic changes
(`openspec/changes/archive/2026-11-0{4,5}-*`). The UI offers protocols ARTNET, SACN, DMX512 and
OSC over UDP, TCP, USB and serial (seen in `popup.connections.vue` and
`universe.modifier.widget.connection.vue`). Which combinations actually work end to end has to
be checked against `wsc-output` § Known issues before it gets documented. Shortcuts are declared
in `uikit.menu.vue` menus (`ctrl`/`shift` bindings) and `uikit.list.vue` (Shift/Ctrl
multi-select).

## Decisions (draft)

### D1. User terms, not protocol terms
"The gateway is a small program that turns Studio's output into Art-Net, sACN or DMX on a USB
interface." No packet fields, ports only where the user must type them.

### D2. Shortcuts page built by reading the menus once
List shortcuts from the menu definitions and list behaviour during this unit, verified in the
app. Keeping them current is unit 5's job (coverage map), not a generator. The user chose
workflow gates over generated pages.

### D3. Troubleshooting as symptom → cause → fix tables
Collect the cases from `wsc-output` Known issues, the GDTF import errors and the missing-fixtures
popup, phrased as what the user sees.

### D4. Desktop downloads link to GitHub Releases through `<ResourceLink to="download">`
No per-OS hard-coded asset URLs: they change every release.

## Risks / Trade-offs

- [Hardware not at hand to verify every protocol] → document what was verified, and mark the
  rest "should work, not yet verified with hardware" in Known limitations rather than guessing.
- [Desktop build behaviour differs per OS (gatekeeper, unsigned builds)] → screenshots per OS
  only for the first-launch warning, captured where available. Otherwise a text-only step and a
  `<!-- TODO media -->` note.
