# Visualizer

ASLS's WebGL based visualizer enables users to visualize and monitor fixtures activity in a 3D environment. It also enables users to interact with fixtures in order to [position](#Transform-Controls) them through simple and intuitive draggable interfaces.

Every patched fixture shows in the view. GDTF fixtures are drawn from their own description: their body, pan and tilt axes and every beam or cell sit where the fixture places them. Bodies follow the fixture's parts: a base, yoke and head for moving heads, a can for PARs and profiles, a scanner body, a bar or a panel, each sized like the real fixture. Fixtures without a description of their own (Open Fixture Library) get the same parts, built from their type and size.

GDTF fixtures you import with their own 3D models show the manufacturer's parts instead: the real base, yoke and head, each sized and placed as the file describes. A part whose model is missing or doesn't match the fixture's size keeps the generated part. The models come only from the GDTF files you imported on this computer: they aren't saved in the showfile, so a show opened on another computer shows them once the same fixtures are imported there. The generic GDTF fixtures bundled with ASLS have no models of their own.

Multi-cell fixtures (LED washes, pixel bars, multi-beam bars) light each cell in its own colour. The light they cast on the floor and in the haze combines neighbouring cells into a few beams, so large rigs stay smooth. Cells a fixture describes as glowing rather than projecting (LED pixels, panels) light up without casting beams.

> **_NOTE:_** The visualizer doesn't show blades, animation wheels or built-in fixture effects.

## Stage Lighting

Each beam lights the floor where it lands, in its colour and intensity, and with the shape of its field angle. Gobos show in the light: GDTF fixtures project their real gobo images; other fixtures use a built-in set of gobo patterns, picked by the gobo wheel slot. Gobo rotation and the gobo index turn the pattern, frost and focus blur it, and the iris narrows the beam. A prism splits the beam into its facets (three when the fixture doesn't describe them) and turns with the prism rotation. Colour temperature (CTO, CTB) warms or cools the light.

Each fixture's brightness follows its light output: a 20,000 lm spot lights the floor and the haze more than a 2,000 lm PAR at the same dimmer. The cells of a multi-cell fixture share its light. In the haze, a beam is brightest near its lens and fades along its shaft; a strong beam pales toward white at its neck, as on camera. Lenses glow in proportion to their size and light, so pixel bars and moving heads blend side by side.

Beams also show in the air, through haze: brighter near the lens, fading with distance, and stopping at the floor. At **high** quality the gobo shows in the haze as shafts of light that match the pattern on the floor. Lit fixtures glow at the lens, and at **medium** and **high** quality bright beams and lenses get a soft bloom.

> **Note:** If a fixture has several gobo wheels, only its first gobo wheel is shown.

<!-- TODO media: floor lit by several beams with gobos, at High quality -->

<Video src="/interface/visualizer.webm"/>

## Camera

You may rotate the visualizer's scene aroud its origin by left-clicking and dragging your mouse around the scene. Right clicking the scene will enable translate mode and allow you to move around the scene, thus modifying the scene's camera rotation origin.

## Transform Controls

Any selected fixture or group of selected fixture may be transformed using the visualizer's built-in transform features. To enable transform mode, make sure one or many fixtures are selected and simply switch between transformation by pressing the <kbd>`R`</kbd>, <kbd>`T`</kbd> or <kbd>`H`</kbd> keyboard keys.

### Rotation

Rotation mode <kbd>`(R)`</kbd> allows you to rotate fixtures or group of fixtures around by dragging the controls around the axis of your choice. Rotation will automatically applied on mouse button release.

<Video src="/interface/visualizer_controls_rotate.webm"/>

### Translation

Similarly, translation mode <kbd>`(T)`</kbd> allows you to translate fixtures or group of fixtures around by dragging the controls  axis of your choice. Translation will automatically applied on mouse button release.


<Video src="/interface/visualizer_controls_translate.webm"/>

### Discrete

Discrete mode <kbd>`(H)`</kbd> simply hides the transformation controls to only display the selection box.

<Video src="/interface/visualizer_controls_discrete.webm"/>

## Settings

The visualizer is highly cutomizable and allows users to interact with its features live. Please refer to the [Toolbar Preferences](/interface/toolbar/#preferences-menu) section for further information opn howw to access visualizer preferences.

### Quality

Quality settings belong to the computer you're on, not to the show: they are kept across reloads and aren't saved in the showfile, so the same show can run at **high** on a desktop and at **low** on a laptop. Changing them doesn't mark the show as unsaved.

| Setting     | Description |
| ----------- | ----------- |
| Quality     | **auto** picks a level from the computer's graphics and adapts it while you work: when frames get slow it lowers the lighting resolution, then the level, and raises them again once there's time to spare. Choose a level to fix it. |
| Lighting resolution | Resolution of the stage lighting when quality isn't **auto**: **100%**, **75%**, **50%** or **35%**. Lower values are faster and softer. |
| Render resolution | Resolution of the whole view: **50%**, **80%** (default) or **100%**. Higher is sharper and slower; it applies at every quality level, also with **auto**. |
| Beam guides | **auto** shows guides at **guides** quality only; **on** and **off** show or hide them at every level. |

| Level  | What you see |
| ------ | ------------ |
| guides | The stage unlit, with beam guides, and no beams in the air. For computers without a usable graphics card. |
| low    | Light on the floor, plain beams in the air and lens glow. Beams aren't hidden behind fixtures. |
| medium | Light on every lit surface at reduced resolution; beams in the air softened by their gobo; bloom. |
| high   | Light on every lit surface at full resolution; gobo shafts in the beams; bloom. |

With **auto**, the visualizer first lowers the detail of the beams in the air at **high**, then the resolution, then the level.

Fixture models follow the level too. **guides** and **low** use the file's low detail models, **medium** its standard ones and **high** its high detail ones, each falling back to the nearest detail the file has. A fixture whose models are too detailed for the level shows its generated parts at that level, so a large rig stays smooth on a slow computer. A fixture you've just patched shows its generated parts for a moment while its models load.

Beam guides are thin lines in each beam's colour: the beam's centre line from the lens to the floor, its edges, and the outline of its footprint on the floor. They stay sharp at any resolution. A fixture with its dimmer at 0 keeps a faint guide, so you can set its position without opening the dimmer.

> **Note:** Nothing is redrawn while nothing changes, so an idle visualizer costs almost nothing. Strobes and rotating gobos keep it drawing.

### Global Scene Illumination

Global scene illumination may be adjusted to fit your needs. 

| Setting    | Description             |
| ---------- | ----------------------- |
| Global Brightness | Brightness of the stage where no beam lights it. |
| Exposure   | Brightness of the beams and the light they cast, in %, saved with the show. **100** is physically accurate: wide beams look dimmer than narrow ones, as on a real stage. Raise it for a more readable view, lower it for a darker room. |

> **Note:** High global brightness makes the beams' light harder to see against the stage.

### Haze

Haze is what makes beams visible in the air: one even haze across the stage. It's saved with the show.

| Setting  | Description |
| -------- | ----------- |
| Density  | How bright beams look in the air, 0 to 100. **0** hides beams in the air; light on the floor stays. |

> **Note:** Shows saved before haze existed open with a density of 50.
