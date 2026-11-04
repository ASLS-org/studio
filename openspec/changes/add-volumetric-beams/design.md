# Design

Refined 2026-11-04 on `feat/add-volumetric-beams`. Unit 3's spike already measured the air beam
variants (8 steps at 1/4, 16 steps at 1/2): both held 60 fps at 40 beams on a Pixel 7a and an M1.
The Pi 5 numbers come with unit 3 task 1.3.

## Context

See proposal.md. Unit 3 delivered the beam state texture (pose, cone, gobo layer, rotation and
blur, colour, prism facets), the gobo texture array, quality levels Guides / Low / Medium / High,
the governor, render on demand, and at Medium/High a prepass target holding receiver albedo and
the depth of receivers and fixture bodies. The floor (z = 0) is the only receiver. The current beam shader
(`beam.vertex.glsl` / `beam.fragment.glsl`) uses per-fragment 4-octave simplex noise, an
`rgb2hsv`/`hsv2rgb` round trip that is equivalent to an RGB multiply, and `dFdx` normals.
Visualizer preferences today: `globalFoggingState`, `globalFoggingDensity`,
`globalFoggingTurbulences`, `globalBrightness`, `autoRotate`.

## Goals / Non-Goals

**Goals:**
- One beam technique with a quality knob (step count, buffer scale) rather than unrelated shaders.
- Gobo shafts in haze at T2.
- Cost bounded by buffer resolution, not by screen-space overdraw at full resolution.

**Non-Goals:**
- Occlusion of beams by truss or set (backlog, T3).

## Decisions

1. **Shared cone hull, analytic ray/cone entry and exit** in the fragment shader (as in the spike);
   the exit is also clipped by the floor plane and, where the prepass exists, by its depth. The
   closed form integrates in-scattering of a point source with inverse-square falloff along that
   segment (an `atan` expression in the ray parameter); the raymarch takes N jittered samples.
2. **Cookie sampled in projector space at each sample**, the same texture array as surfaces, so
   gobos match between air and floor.
3. **Baked tileable 3D noise texture** (for example 64^3, R8) scrolled over time for haze motion,
   one lookup per sample instead of procedural noise.
4. **Half/quarter-resolution beam buffer** with a depth-aware upsample against the scene depth;
   additive, so order-independent.
5. **Fog to haze mapping on load** (corrected 2026-11-04 after reading the old shader): the old
   fog settings never hid beams. `globalFoggingState` only switched the noise on, and
   `globalFoggingDensity` set the noise size, not brightness. So a showfile without haze keys opens
   with `hazeDensity` 50 (the default) and `hazeMovement` = `globalFoggingTurbulences` when
   fogging was enabled, 0 otherwise. Saving writes only `hazeDensity` and `hazeMovement` (0-100).
6. **Air beams per quality level** (confirmed 2026-11-04):

   | Level | Air beam | Buffer | Bloom |
   |---|---|---|---|
   | Guides | none | - | no |
   | Low | closed form, no gobo, clipped by the floor plane only | 1/2 | no |
   | Medium | closed form, gobo sampled once at the segment middle with extra blur | 1/2 | yes |
   | High | raymarch, 16 samples (governor: 8 before any resolution step), gobo and haze noise per sample | full | yes |

   (Buffer sizes raised from 1/4, 1/4, 1/2 in the second review, decision 10.)

   Low has no prepass, so its beams are not hidden behind fixture bodies; Medium and High clip
   against the prepass depth and upsample depth-aware.
7. **Own bloom pass** (confirmed 2026-11-04): bright-pass on the air beam buffer plus the lens
   glows into a 1/2 target, a 4-level downsample/upsample blur chain, added back. The source is
   the emissive passes only, not the whole frame: the main pass draws straight to the antialiased
   canvas, which can't be sampled. Lens glow is a small additive sprite per
   beam at the lens, scaled by intensity, so the bloom has something bright to catch at every
   lit level. The unused `postprocessing` dependency is removed.
8. **Governor:** at High it first drops raymarch samples from 16 to 8, then follows unit 3's
   resolution and level steps.

9. **Look tuning** (2026-11-04, after the user's review: the first pass looked raw, grainy and
   overexposed):
   - Intensity per solid angle: beam power × (tan 12.5° / tan half-angle)², clamped to 0.15-4,
     for surface and air light alike, so a wider zoom is dimmer and a narrower one brighter.
   - Every air technique starts from the closed-form estimate, taken where the view ray passes
     closest to the beam axis, with a soft radial profile (full core, 0 at the rim), a
     Henyey-Greenstein phase (g = 0.55: brighter looking into a beam) and extinction toward the
     camera (0.015 /m). The High raymarch only averages the gobo and haze variation (0.7-1.3)
     with the same falloff weights, so its noise never changes the beam's overall brightness.
   - A separable 5-tap blur on the air buffer before upsampling removes raymarch grain and the
     steps of the 1/4 buffer.
   - Haze noise tiles every 25 m and drifts slowly. Bloom only takes light above 1.2, at 0.25
     strength. Lens glow is a small Gaussian reaching 0 at the sprite edge (no ring), strongest
     looking into the fixture. Surface gain 80, air gain 0.2, gobo rim softened (0.8-1.0).

10. **Sharpness and artifact fixes** (2026-11-04, second review: faint, blurry, holes looking up a
    beam, "fish scales" in a crowded rig):
    - The ray's segment inside the cone is exact (sides, apex plane, far cap); the polygon hull
      only decides which pixels run. Bounding the segment by the hull's faces made brightness
      step along every facet: the fish scales.
    - The closed form is integrated in 4 pieces, each with its own profile, phase, extinction
      and end fade, instead of one representative point; the profile's radius never drops
      below the lens (0.1 m). Both removed the holes and hard discs near the lens.
    - Raymarch jitter is offset per beam, so overlapping beams don't stack one pattern.
    - Buffers: Low and Medium 1/2, High full resolution (times the resolution scale); a 3-tap blur
      only below full resolution; profile rim 0.55-1.0; phase g = 0.3 (about 3× head-on); air
      gain 0.35, extinction 0.008 /m; dithering only on 8-bit buffers; lens glow rolls off.

11. **Surface light mixing** (2026-11-04, third review: RGB mixing looked layered, light cut,
    edges too hard):
    - Beam light sums in linear space (half-float light buffers where supported). The composite
      computes albedo × (ambient + light), tone-maps and encodes it exactly like the main pass
      draws the unlit floor, and adds only the difference. Before, encoded light was added on top
      of the tone-mapped scene, and each 8-bit channel clipped on its own (hue shifts).
    - Low accumulates its footprints into a 1/2 light buffer, then a floor overlay (depth-tested)
      applies the same formula, so overlapping footprints mix like at Medium and High.
    - Footprint extent: a grazing beam is bounded by its length, not a fixed 1.45 rad cap (it cut
      the far end of the ellipse); maximum half size 60 m.
    - Beam profile on surfaces: field falloff to about 60% at the rim, and a rim fade over the
      outer 22% of the radius plus 10% per mip level of focus or frost blur.
    - Light buffers clear to black (three.js leaves the scene background as clear colour).

12. **Exposure and visible haze** (2026-11-04, fourth review: the physical result looked faint,
    haze Movement did nothing visible):
    - Exposure (25-400 %, showfile key `exposure`, default 100) sets the renderer's tone mapping
      exposure, which the surface composite shares, and scales air light and lens glow. Global
      Brightness stays the unlit stage's level.
    - Haze noise tiles every 11 m with cloud contrast 0.25-1.75, drifting about 1.3 m/s at
      Movement 100 (was 25 m tiles, 0.7-1.3 contrast, 0.5 m/s: averaged away along each ray).
      Measured in the page at High: 0 changed pixels per second at Movement 0, about 37,000 at 50.

13. **Static haze, gentler angle compensation, zoom decoding** (2026-11-04, fifth review):
    - The user didn't want visible haze shapes: the noise texture, Movement and the drift are
      removed (decision 3 withdrawn, Movement in decisions 5 and 12 withdrawn). Haze is one
      uniform density; the High raymarch only carries the gobo. Nothing animates the view.
    - Angle compensation uses exponent 1.5 (was the physical 2), clamped 0.25-4, and the field
      falloff is 20% at the rim (was 40%), floor gain 110: wide beams looked too dull on the floor
      next to their haze, which grows with path length.
    - Zoom decoding: OFL "narrow" / "wide" presets decode to 1 / 100 (a percentage), but the
      `zoom` setter took it as a fraction of the maximum angle only, so a MAC Aura zoomed narrow
      became a 0.6 degree pinpoint at full angle boost. Zoom channels whose values are only
      presets (0, 1, 100) now span the lens range; other zoom values are degrees.

## Risks / Trade-offs

- [Upsample halos at depth edges] → bilateral (depth-aware) upsample; full resolution at T3.
- [Banding at low step counts] → per-pixel jitter plus temporal blend.
- [Look differs from the current one] → side-by-side comparison on the demo show before removing
  the old shaders.

## Open Questions

- none (Pi 5 numbers may move the Low/Medium boundary; unit 3 task 1.3)
