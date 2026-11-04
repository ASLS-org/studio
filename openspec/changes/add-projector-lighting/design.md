# Design

Draft from the epic planning (2026-11-03). Refine in the unit branch, after the spike, before
writing specs and tasks.

## Context

See proposal.md and the epic doc § Findings and § Target architecture. Unit 2 provides the
per-beam state buffer and a message-shaped visualizer API. Renderer today: `WebGLRenderer`
(antialias, pixel ratio 0.8, ACES tone mapping), Phong/Standard materials lit by one `SpotLight`
per fixture, Three.js r170.

## Goals / Non-Goals

**Goals:**
- Cost that grows with covered pixels, not with lights times pixels.
- Same per-beam input for every tier; tier switching without reloading the show.
- Usable frame rate on Intel HD 5500/6000; Pi 5 as stretch.

**Non-Goals:**
- In-air volumetrics (unit 4), shadows (backlog).

## Decisions

1. **Spike before committing.** A standalone page with 20 beams and gobos, measuring frame time
   for T0, T1 and T2 surface lighting and a raymarched beam on the 2015 laptop and the Pi 5. The
   results set the tier boundaries and are recorded here.
2. **Deferred light volumes for surfaces (T1-T2).** Draw each beam's cone hull against the depth
   buffer, reconstruct world position, project into the beam's space, sample its cookie, add light.
   WebGL2 depth textures are core. *Alternative:* clustered forward lighting with a light data
   texture; kept as fallback if the depth pass costs too much on V3D.
3. **Footprint decals for T0.** One additive ellipse per beam on the floor plane with its cookie.
4. **Cookie = gobo texture array**, one layer per gobo, mip levels for focus/frost, UV rotation for
   gobo rotation and shake, index change for gobo change.
5. **WebGL2 baseline; RGBA8 targets in T0-T1** (float colour buffers not guaranteed on V3D).
6. **Governor:** initial tier from WebGL2 support, software-renderer strings (SwiftShader,
   llvmpipe) via `WEBGL_debug_renderer_info`, `navigator.deviceMemory`, `hardwareConcurrency`;
   adjusts resolution scale first, then tier, from a rolling frame-time average, with hysteresis.
7. **Worker + OffscreenCanvas** with event forwarding for orbit and gizmo; picking runs in the
   worker. Same-thread fallback uses the same module.
8. **Quality settings in `localStorage`**, wrapped in try/catch; the showfile keeps only artistic
   settings (brightness, fog).

## Risks / Trade-offs

- [Pi 5 fill rate too low even for T1] → T0 plus resolution scale down to about 0.35, with beam
  guides kept at full resolution; Guides tier as the floor. Record it in the epic doc.
- [Gizmo and orbit feel laggy through the worker] → measure input latency in the spike; keep
  controls on the main thread if needed.
- [Losing the current look before unit 4 lands] → the existing beam cones stay drawn on top until
  unit 4 replaces them.

9. **Built-in gobo set drawn in code** (confirmed 2026-11-04). About 8-12 patterns (dots,
   breakup, lines, star, spiral...) are drawn procedurally into the cookie texture array when the
   visualizer starts: no image files, no licence question. Wheel slots map to patterns by slot
   number until unit 5 brings GDTF wheel images. The 7 OFL gobo images (5 bundled fixtures) are
   not used.
10. **No per-showfile Quality override** (confirmed 2026-11-04). Quality is a device setting only;
    a presentation machine sets its own.
11. **Beam guides** (confirmed 2026-11-04). Per beam, line segments for the centre line from the
    lens to where it meets the floor or the end of the beam, 8 cone edges, and a 32-segment
    footprint ring, all computed in the vertex shader from the per-beam state: one instanced draw,
    82 vertices per beam. Colour comes from the beam; brightness scales with intensity down to a
    faint floor (25%), so a beam with the dimmer at 0 still shows where it points. Guides draw
    after the lighting, at the canvas's full resolution even when the lighting renders scaled
    down, so they stay sharp as resolution drops. They form the lowest tier ("Guides": unlit stage
    plus guides) and are also a Visualizer setting (Auto follows the tier, On, Off) usable at any
    tier. Lines are 1 px (WebGL ignores line width) and stop at the floor plane, not at set pieces.

## Spike

A standalone page (published as a private claude.ai Artifact, not part of the repo) runs on the
2015 laptop and the Pi 5 in Chromium. Results are recorded here.

Results, page version 1 (2026-11-04), on two strong devices rather than the targets:

| Device | Browser | 20 beams, every variant | 40 beams, baseline | 40 beams, new variants |
|---|---|---|---|---|
| Pixel 7a (Mali-G710) | Chrome 156, Android | 60 fps | 60 fps | 60 fps |
| MacBook M1 | Firefox 159 | 60 fps | 28 fps, p95 67 ms | 60 fps |

- The SpotLight baseline does not scale: it is the only variant that drops below refresh (M1 at
  40 beams). Its shader recompiles when the beam count changes (first frame 204 ms at 20 beams and
  338 ms at 40 on the Pixel); the new variants compile in under 70 ms.
- Every new variant, T2 included, holds 60 fps at 40 beams on a phone GPU.
- Load × 3 never left the refresh cap, and neither browser exposes the GPU timer, so version 1
  can't rank the variants by cost. The Worker run failed to start on both (the page loaded it by a
  relative URL).

Version 2 replaces load × 3 with a load ramp per variant at 40 beams (doubling until a frame misses
refresh), which ranks variants without the GPU timer, and starts the Worker from blob URLs when its
URL is refused. Version 3 adds two variants: guides only (unlit stage), and T1 at 0.5 resolution
with guides at full resolution. Tier boundaries still need the 2015 laptop and the Pi 5: pending.

## Open Questions (resolve while refining this unit)

- none (tier boundaries come from the spike)
