# Visualizer (src/plugins/visualizer)

Three.js r170 WebGL renderer for the rig. It is instantiated by
`views/activities/app/fragments/visualizer/visualizer.fragment.vue` and exposed as
`$show.visualizerHandle`, whose `showData` / `preferences` are persisted in the showfile.

| Module | Role |
|---|---|
| `visualizer.js` | renderer, camera, orbit controls, render loop, global fog/brightness preferences |
| `scene_manager.js` | singleton `THREE.Scene` |
| `animation_manager.js` | singleton rAF loop for render-side animations (separate from `Live`) |
| `model_instancer.js` | GLTF/Draco preloading from `public/visualizer/models/model_list.json` |
| `moving_head.js` | fixture 3D instance: pan/tilt/zoom/colour/strobe/wheel setters + volumetric beam |
| `shaders/beam.*.glsl` | volumetric beam shaders, imported with `?raw` |
| `controls.js` | TransformControls (translate/rotate) for fixture placement |
| `instance_highlight.js` | selection outline |
| `grid.js` | infinite grid helper |
| `orbitcontrol.zup.patch.js` | vendored OrbitControls patched for Z-up. Don't edit or lint it |

## Rules

- The world is **Z-up**. Fixture `position` / `rotation` are persisted in the fixture's `showData`.
- `Fixture` (models/DMX) owns its `MovingHead` and pushes channel values into its setters. The
  visualizer must never write back into models.
- Per-frame code (`update(t)`, setters called each tick) must not allocate: reuse vectors, colours
  and materials. Dispose geometries, materials and textures when removing instances.
- Static assets load through `import.meta.env.VITE_STATIC_URL` (the `static://` protocol in
  Electron). Never hard-code `/`.
- Many files are `/* eslint-disable */`. Don't spread that: new modules lint clean, and imports from
  `three/examples/jsm/*` keep the explicit `.js` extension (lint override is in `.eslintrc.js`).
- `postprocessing` is a dependency but is currently unused in `src/`.
- Only `Moving Head` fixtures have a 3D type. New fixture types add a class here and a
  `case` in `Fixture.prepare3DModelInstance()`.
