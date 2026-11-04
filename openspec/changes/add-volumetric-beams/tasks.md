# Tasks

## 1. Visualizer: haze settings

- [x] 1.1 `Visualizer`: `hazeDensity` and `hazeMovement` (0-100) with setters that invalidate the
      view; `showData` writes them instead of the fog keys; `preferences` reads them, or maps
      `globalFoggingState` and `globalFoggingTurbulences` when they are missing (design.md
      decision 5). Verify: spec "Fog disabled in an old showfile" and "Demo
      show" hold after `localStorage.removeItem('ASLS_STUDIO_SHOWFILE')` and a reload; "Haze saved
      with the show" holds after Save and reload.
      Note (2026-11-04): mapping corrected to the old shader's meaning (design.md decision 5):
      the demo opens at Density 50, Movement 50; an old showfile with fogging disabled at 50
      and 0.
- [x] 1.2 Visualizer popup: replace the Fogging section with Haze (Density, Movement), cancel
      restores them (skill `vue-ui-change`). Verify: changing each value in `npm start` changes
      the view at once; Cancel restores them; spec "No haze" holds.

## 2. Visualizer: air beam pass

- [x] 2.1 Bake a tileable 64³ R8 haze noise texture at start and scroll it by `hazeMovement`
      over time (design.md decision 3); report the animation to render on demand when Movement is
      above 0. Verify: spec "Drifting haze" holds; with Movement 0 and nothing moving, 0 frames
      are drawn over 3 s.
      Note (2026-11-04): at High with Movement 50, 183 frames in 3 s; Movement 0, 0 frames;
      Low ignores Movement (0 frames).
- [x] 2.2 Air beam shader on the beam state: cone hull back faces, analytic ray/cone entry,
      exit clipped by the cone length, the floor plane and (Medium/High) the prepass depth;
      closed-form in-scattering for Low and Medium, Medium sampling the gobo once at the segment
      middle with extra blur; 16-sample jittered raymarch with gobo and haze noise per sample for
      High (design.md decisions 1, 2 and 6). Verify: spec "Low level", "Gobo shafts", "Rotating
      gobo in the haze" and "Dimmer closed" hold with the demo show and a patched gobo fixture.
      Note (2026-11-04): checked with the demo rig and a patched Elation Platinum Spot 15R
      Pro. Air beams fade out before the cone end, and the air buffer is half float where
      supported (RGBA8 with dithering otherwise) to avoid banding.
- [x] 2.3 Render air beams into a 1/4 (Low, Medium) or 1/2 (High) target and composite with a
      depth-aware upsample (Medium/High) or a plain additive upsample (Low) (design.md decision
      4). Verify: at Medium and High a beam passing behind a fixture body is hidden by it; no
      halo wider than a few pixels around fixture bodies in a screenshot.
      Note (2026-11-04): looking along the fixture row at High, fixture bodies stay clean
      where beams pass behind them; Low shows quarter-resolution steps on beam edges.
- [x] 2.4 Governor: at High, drop raymarch samples from 16 to 8 before any resolution step, and
      restore them first when raising (design.md decision 8). Verify: spec "Slow frames at High"
      holds with synthetic frame times fed to the governor in the page.
      Note (2026-11-04): samples drop first; raising goes the other way (level, resolution,
      then samples last), and a raise into High starts at 8 samples. Checked with synthetic
      frame times.

## 3. Visualizer: bloom and lens glow

- [x] 3.1 Lens glow: one additive sprite per beam at the lens, in the beam's colour, scaled by
      intensity, at Low, Medium and High. Verify: spec "Lens glow" holds.
- [x] 3.2 Bloom pass at Medium and High: bright-pass into a 1/2 target, 4-level
      downsample/upsample blur, added back (design.md decision 7); remove the unused
      `postprocessing` dependency from `package.json`. Verify: spec "No bloom at Low" holds;
      `npm install` and `npm run build` pass without `postprocessing`.
      Note (2026-11-04): bloom spreads from the air buffer and lens glows, not the whole frame
      (design.md decision 7). `npm run build` passes.

## 4. Visualizer: old beams out

- [x] 4.1 Compare the demo show side by side, old beams against new at High, from the default
      camera, and keep both screenshots for the PR. Then remove the old beam meshes, their
      instanced attributes and `shaders/beam.*.glsl` from `moving_head.js`, and the fog setters.
      Verify: `grep -rn "beam.fragment\|fogTurbulence" src` finds nothing; the demo show renders
      with no console errors.
      Note (2026-11-04): old (epic branch) and new screenshots of the demo show taken in the
      scratchpad, to attach to the PR by hand.

## 5. Docs and context

- [x] 5.1 Manual: Visualizer page § Settings, replace Fogging with Haze, and say what each quality
      level shows in the air (skill `user-manual`). Verify: the page reads correctly in the
      Markdown preview (the manual dev server is broken since unit 2, see unit 3 task 6.4).
      Note (2026-11-04): checked as Markdown only.
- [x] 5.2 Update `src/plugins/visualizer/CLAUDE.md` (air beam pass, bloom, haze, no old beam
      shaders) (skill `ai-context-maintenance`). Verify: the file describes the new passes.

## 6. Integration

- [x] 6.1 With the demo show in `npm start`, run the chase, a scene and the effects at each level;
      check air beams, gobo shafts, bloom and footprints follow the DMX values, frame rate and no
      console errors (skill `run-studio`). Verify: spec "The view shows the output values" holds
      at every level.
- [x] 6.2 `npx eslint` on all touched files is clean.

## 7. Look tuning (after the user's review)

- [x] 7.1 Scale surface and air light by the beam's solid angle (design.md decision 9). Verify:
      spec "Zoom out" holds; the demo's wide floor fixture is faint, narrow beams brighter.
- [x] 7.2 Air beams: closed-form base at every level with soft profile, phase and extinction; the
      High raymarch only modulates it; 5-tap blur of the air buffer. Verify: spec "Low level
      edges" holds; High shows smooth gobo shafts without grain (screenshots `ct-b-*.png`).
- [x] 7.3 Subtler haze noise, bloom threshold 1.2 at 0.25 strength, ring-free lens glow; surface
      gain 80, air gain 0.2. Verify: spec "Looking into a beam" holds; the demo rig no longer
      washes out at High.
- [x] 7.4 `npx eslint` on the touched visualizer files is clean; playback at every level shows no
      console errors.

## 8. Sharpness and artifacts (second review)

- [x] 8.1 Exact ray segment inside the cone (hull only for coverage), per-beam jitter offset.
      Verify: a crowded rig (16 beams crossing, wide zoom) shows no facet pattern at High, Medium
      and Low (screenshots `cu-e-crowd-*.png`).
- [x] 8.2 Closed form in 4 pieces, profile radius floored at the lens, phase g = 0.3. Verify:
      looking up a beam from inside it shows the lens and haze glow, no holes or hard disc
      (`cu-e-up.png`).
- [x] 8.3 Sharper buffers (Low/Medium 1/2, High full), 3-tap blur only below full resolution,
      tighter profile rim, brighter air, dithering only on 8-bit buffers. Verify: no shader
      errors in the console; `npx eslint` clean on the touched files.

## Workflow follow-up

- Archive the change on the unit branch, set unit 4 to `archived` in the epic doc, then open a PR
  from `feat/add-volumetric-beams` into `epic/gdtf-render-pipeline`.
