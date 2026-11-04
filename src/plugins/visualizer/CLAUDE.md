# Visualizer (src/plugins/visualizer)

Three.js r170 WebGL renderer for the rig. It is instantiated by
`views/activities/app/fragments/visualizer/visualizer.fragment.vue` and exposed as
`$show.visualizerHandle`, whose `showData` / `preferences` are persisted in the showfile.

| Module | Role |
|---|---|
| `visualizer.js` | renderer, camera, orbit controls, render-on-demand loop, haze/brightness preferences, quality settings |
| `scene_manager.js` | singleton `THREE.Scene` |
| `animation_manager.js` | singleton rAF loop for render-side animations (separate from `Live`) |
| `model_instancer.js` | GLTF/Draco preloading from `public/visualizer/models/model_list.json` |
| `fixture_renderer.js` | one `MovingHead` per patched fixture from `Show.patchSnapshot`; decodes universe frames through profile channels; gizmo handles |
| `moving_head.js` | fixture 3D instance (body meshes only): pan/tilt/zoom/colour/strobe/gobo/frost/prism setters; writes its beam rows (one per prism facet) |
| `beam_state.js` | per-beam float texture (cone matrix, inverse, colour, gobo, floor footprint, origin), rewritten each frame; read by every lighting pass |
| `stage_lighting.js` | quality levels: Guides (unlit), Low (floor decals), Medium/High (deferred light volumes on receivers at a resolution scale), beam guides; object layers RECEIVER/OCCLUDER |
| `gobos.js` | built-in gobo patterns drawn in code into a mipmapped texture array; wheel slot → layer |
| `beam_shading.js` | GLSL shared by every beam pass (beam state reads, gobo lookup, light falloff), cone hull geometry, `ACCUM` |
| `air_beams.js` | beams in the haze: closed form (Low, Medium + soft gobo) or raymarch with the gobo (High), uniform haze, 1/4 or 1/2 buffer, depth-aware upsample |
| `bloom.js` | lens glow sprites (Low and up) and bloom from the air buffer and lens glows (Medium, High) |
| `quality.js` | quality settings in `localStorage` (never in `showData`), starting level from the device, `QualityGovernor` for Auto |
| `controls.js` | TransformControls (translate/rotate) for fixture placement |
| `instance_highlight.js` | selection outline |
| `grid.js` | infinite grid helper |
| `orbitcontrol.zup.patch.js` | vendored OrbitControls patched for Z-up. Don't edit or lint it |

## Rules

- The world is **Z-up**. Fixture `position` / `rotation` are persisted in the fixture's `showData`.
- The visualizer is driven by data only. `visualizer.fragment.vue` feeds the renderer:
  `patch_changed` → `setPatch(Show.patchSnapshot)` (coalesced per animation frame),
  `fixture_pose` → `setPose`, `fixture_highlight` → `highlight`. Each rendered frame the renderer
  re-decodes fixtures whose bytes changed in their universe `frame`. Models never import this folder.
- The only write back is the gizmo: `FixtureHandle` setters emit `fixture_transformed`, and the
  fragment applies it to the fixture (`position` / `rotation` setters). Nothing else here writes
  into models.
- Per-frame code (`update(t)`, setters called each tick) must not allocate: reuse vectors, colours
  and materials. Dispose geometries, materials and textures when removing instances.
- Render on demand: `Visualizer.render()` draws only when `needsRender` is set (DMX change, camera
  move, gizmo `change`, pointer/key input, settings, patch/pose/highlight via `FixtureRenderer`'s
  `onChange`) or something animates (strobe, gobo rotation). Anything new that changes
  the picture must call `visualizer.invalidate()`.
- There are no three.js lights for fixtures. Beam light comes from `stage_lighting.js`; a surface
  lit by beams registers with `lighting.addReceiver(mesh, albedoMaterial)`, and fixture bodies sit on
  the OCCLUDER layer. The world floor is the plane z = 0.
- Static assets load through `import.meta.env.VITE_STATIC_URL` (the `static://` protocol in
  Electron). Never hard-code `/`.
- Many files are `/* eslint-disable */`. Don't spread that: new modules lint clean, and imports from
  `three/examples/jsm/*` keep the explicit `.js` extension (lint override is in `.eslintrc.js`).
- `hazeDensity` and `exposure` are in the visualizer `showData` (older showfiles without them open
  at 50 and 100; their `globalFogging*` keys are ignored). Quality settings are not.
- Only `Moving Head` fixtures have a 3D type (`Fixture` refuses other categories). New fixture
  types add a class here, created by `FixtureRenderer.createInstance()` from the patch entry.
