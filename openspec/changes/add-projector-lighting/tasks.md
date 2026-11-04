# Tasks

## 1. Spike

- [x] 1.1 Build the standalone spike page (SpotLight baseline, T0 decals, forward loop, deferred
      volumes at 1, 0.75 and 0.5 scale, air beams, beam guides, load ramp, Worker run) and publish it
      as a private Artifact. Verify: every variant compiles in headless Chrome with no shader error.
- [x] 1.2 Run it on two strong devices (Pixel 7a, M1) and record the results in design.md § Spike.
      Verify: the results table is in design.md.
- [ ] 1.3 Run spike version 3 on the 2015 laptop and the Pi 5 in Chromium; record the results and
      set the tier boundaries, the governor's starting rules and the minimum resolution scale in
      design.md. Until then, use the provisional values in task 6.1. Verify: design.md § Spike has
      both machines and no "pending".
      **Waiting on hardware (2026-11-04):** the user has no access to these machines yet.

## 2. Visualizer: per-beam state

- [x] 2.1 Add a beam state module in `plugins/visualizer/`: a float texture with one row per beam
      (cone matrix and inverse, colour and intensity, gobo layer, rotation and blur, floor
      footprint, origin and length), written in place each frame with no allocation, grown in
      blocks when the patch grows. Verify: `npx eslint` clean; with the demo show, logging the
      texture row of a fixture from the console shows its pan/tilt change when its fader moves.
- [x] 2.2 `FixtureRenderer.decode()` and `MovingHead` write pose, field angle (zoom), colour,
      intensity (dimmer × shutter/strobe), gobo slot, gobo rotation and focus/frost into the beam's
      row; decode the Gobo Wheel `WheelSlot` capability that is skipped today. Prism sub-beams take
      extra rows from the same fixture. Verify: in `npm start`, spec "Pan moves the light on the
      floor" and "Zoom widens the footprint" hold once task 4.2 lands; until then the row values
      change as in 2.1.

## 3. Visualizer: gobos

- [x] 3.1 Draw the built-in gobo set in code into a mipmapped texture array when the visualizer
      starts (open plus about 9 patterns, 128 px, as in the spike); map wheel slot n to pattern
      (n - 1) modulo the set size, open slots to the open pattern (design.md decision 9). Verify:
      spec "Select a gobo", "Rotating gobo" and "Frost" hold in `npm start` on a fixture with a gobo
      wheel (Gobo Wheel channel) once task 4.2 lands.

## 4. Visualizer: surface lighting

- [x] 4.1 Replace the stage materials with unlit albedo plus ambient materials driven by the global
      brightness preference; remove the per-fixture `SpotLight` from `moving_head.js` and the
      directional light's role in fixture lighting. Keep the in-air beam cones as they are.
      Verify: `npm start` with the demo show: the stage and fixtures render, beams still show in
      the air, no `SpotLight` remains (`grep -rn SpotLight src/plugins/visualizer`).
- [x] 4.2 Low level: one instanced additive floor decal per beam, lit with its gobo (design.md
      decision 3). Verify: spec "Pan moves the light on the floor" and "Select a gobo" hold at Low.
- [x] 4.3 Medium and High: deferred light volumes (back-face cone hulls, world position from the
      depth texture, RGBA8 accumulation, composite), with a resolution scale for the lighting
      targets (design.md decisions 2 and 5). Verify: spec "Forty beams at once" holds at High with
      40 fixtures; walls and set pieces are lit; at Medium the lighting renders at reduced scale.
      Note (2026-11-04): the stage has no walls or set pieces yet; the floor is the only
      receiver. Fixture bodies occlude. Checked with 17 demo fixtures plus a patched Elation.
- [x] 4.4 Switching level rebuilds only the render targets and materials, never the patch. Verify:
      spec "Switch level during playback" holds; the toolbar shows no unsaved marker afterwards.

## 5. Visualizer: beam guides

- [x] 5.1 One instanced line draw per frame: centre line, 8 cone edges and a 32-segment footprint
      ring per beam, in the beam's colour, at 25% brightness when its intensity is 0, drawn after
      the lighting at the canvas's full resolution (design.md decision 11). Verify: spec "Guides
      level", "Dimmer closed" and "Low resolution" hold in `npm start`.

## 6. Visualizer and UI: quality setting and governor

- [x] 6.1 Governor: starting level from WebGL2 support, software renderer detection
      (SwiftShader, llvmpipe, via `WEBGL_debug_renderer_info`), `deviceMemory` and
      `hardwareConcurrency`; provisional rules until task 1.3: software renderer → Guides,
      `deviceMemory` ≤ 4 or ≤ 4 cores → Low, else High. Lower the scale (1, 0.75, 0.5, floor 0.35)
      then the level after 3 s of frames over 1.25 × the refresh interval; raise after 10 s under
      0.6 ×. Verify: spec "Software renderer" holds with `--use-angle=swiftshader`; "Heavy rig on a
      weak machine" and "No flicker between levels" hold with a forced 80-fixture rig, watching the
      level from the console.
      Note (2026-11-04): checked with SwiftShader (starts at Guides) and with synthetic frame
      times fed to the governor in the page (steps down after 3 s, up after 10 s, no flicker near
      the refresh rate, raise blocked 60 s after an undone raise). Raising uses the time spent
      drawing, since frame intervals can't drop below the refresh interval.
- [x] 6.2 Quality settings stored per device in `localStorage` (wrapped in try/catch, Auto when
      unavailable), never in `showData`: Quality (Auto, Guides, Low, Medium, High), resolution scale,
      Beam guides (Auto, On, Off). Verify: spec "Setting survives reload", "Not part of the show"
      and "Storage blocked" hold.
- [x] 6.3 Add the three controls to `popup.visualizer.vue` with `uk-select-input` / `uk-num-input`
      (skill `vue-ui-change`). Verify: changing each control in `npm start` changes the view at
      once; spec "Guides on at High quality" holds.
- [ ] 6.4 Update the manual: Visualizer page § Settings (Quality, resolution scale, Beam guides,
      what Auto does) and the toolbar preferences page if its screenshot or list changes (skill
      `user-manual`). Verify: `npm run docs:manual:serve` shows the new settings.

## 7. Visualizer: render on demand

- [x] 7.1 Draw a frame only when a universe frame changed, the camera or gizmo moved, the patch,
      pose, highlight or a setting changed, or a visual animation runs (strobe, gobo rotation,
      governor probe). Verify: spec "Idle show" holds (Chrome Performance panel shows no GPU work
      over 5 s idle) and "Wake on change" holds.
      Note (2026-11-04): idle with fog turbulence 0 draws 0 frames in 3 s; fog turbulence above
      0 animates the in-air beams, so it keeps drawing. Camera moves compare matrices with a 1e-6
      tolerance (orbit controls recompute the camera every frame).

## 8. Visualizer: Worker and OffscreenCanvas

- [ ] 8.1 Move the renderer into a module Worker drawing to an `OffscreenCanvas`: the fragment
      sends the patch snapshot, pose and highlight events and settings; changed universe frames
      are copied to the worker once per tick (512 bytes per universe, no SharedArrayBuffer).
      Static assets load through `VITE_STATIC_URL` from the worker. Verify: `npm start` and
      `npm run electron:start` both render the demo show from the worker.
- [ ] 8.2 Forward pointer, wheel and resize events for orbit; run gizmo picking and drags in the
      worker and send `fixture_transformed` back. Verify: visualizer spec "Move with the gizmo"
      and "Select two fixtures" still hold; spec "Busy editor" holds.
- [ ] 8.3 Same-thread fallback with the same module when `transferControlToOffscreen` is missing.
      Verify: spec "No background-thread support" holds with the worker path forced off.
- [ ] 8.4 Update `src/plugins/visualizer/CLAUDE.md` and the root `CLAUDE.md` architecture map
      (beam state, tiers, worker, render on demand; no `SpotLight`s) (skill
      `ai-context-maintenance`). Verify: both files describe the new renderer.

## 9. Integration

- [ ] 9.1 With the demo show in `npm start`, run a scene, a dimmer effect and a looping chase at
      each quality level with guides on and off; check gobos, colours and footprints match the
      DMX values in the universe view (skill `run-studio`). Verify: spec "The view shows the
      output values" holds at every level.
- [ ] 9.2 `npx eslint` on all touched files is clean.

## Workflow follow-up

- Open a PR from `feat/add-projector-lighting` into `epic/gdtf-render-pipeline`.
- Archive the change on the unit branch, then set unit 3 to `archived` in the epic doc.
