# Design

Draft from the epic planning (2026-11-03). Refine in the unit branch before writing specs and
tasks; this unit has the most open product questions.

## Context

See proposal.md. Units 1-3 provide the profile shape, the DMX-to-beam-state decoder and the
projector renderer. A `.gdtf` file is a zip with `description.xml` (fixture type, attribute
definitions, wheels, physical descriptions, models, geometries, DMX modes with DMX channels,
logical channels, channel functions and channel sets), plus `models/` (3ds, glTF; GDTF 1.2 adds
`gltf_low` / `gltf_high` folders) and `wheels/` images.

## Goals / Non-Goals

**Goals:**
- Any GDTF fixture patches, plays and renders with the right geometry and beams.
- OFL fixtures keep working and render with fallback geometry.

**Non-Goals:**
- Full GDTF coverage on day one (DMX profiles with complex mode masters, sub-physical units,
  connectors); unsupported parts degrade to the profile's `Unknown` attribute.

## Decisions

1. **GDTF adapter maps** DMX channel → logical channel → channel functions onto profile channels
   with attribute and DMX ranges; geometry references build the geometry tree; `Beam` geometries
   become beams with beam angle, field angle, luminous flux and colour temperature.
2. **Geometry renderer instancing per fixture type and geometry part**, transforms from the
   geometry tree; LOD picks `gltf_low` / `gltf` / `gltf_high` by tier, falls back to a proxy box.
3. **Wheel images into the gobo texture array** at import time, resized to the array size.
4. **Fallback geometry for OFL** by category (moving head, PAR, bar, wash) using the OFL physical
   dimensions.
5. **Parsing off the main thread** (worker) so importing a large file doesn't freeze the UI.

## Risks / Trade-offs

- [GDTF files vary in quality; some lack models or have heavy meshes] → proxy geometry and
  polygon budget per tier; decimation on import if needed.
- [Showfile size if GDTF data is embedded] → decide embedding vs local library while refining.

## Open Questions (resolve while refining this unit)

- Source: user import only, GDTF Share (account, API credentials, CORS, likely Electron), or a
  curated bundle; redistribution terms of Share files.
- Showfile: embed imported `.gdtf` data, or reference a local library (IndexedDB in the browser,
  app data folder in Electron) and handle missing fixtures on open.
- Zip library choice (for example `fflate`).
