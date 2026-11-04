# Visualizer

ASLS's WebGL based visualizer enables users to visualize and monitor fixtures activity in a 3D environment. It also enables users to interact with fixtures in order to [position](#Transform-Controls) them through simple and intuitive draggable interfaces.

> **_NOTE:_** Currently implemented visualizable fixtures only  include moving heads. Regarding visualizing capabilities, the 3D engine is currently capable of emulating most fixture channels capabilities **EXCEPT:** *Multi-Color wheel slots, Multi-bulbs (rendered as single bulb), blading system and any non-standard capabilities*.

## Stage Lighting

Each beam lights the floor where it lands, in its colour and intensity, and with the shape of its field angle. Gobos show in the light: the visualizer uses a built-in set of gobo patterns, picked by the fixture's gobo wheel slot, so a projected pattern looks like a gobo but not like the fixture's exact gobo image. Gobo rotation turns the pattern, frost and focus blur it, and a prism splits the beam into three.

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
| Resolution  | Resolution of the stage lighting when quality isn't **auto**: **100%**, **75%**, **50%** or **35%**. Lower values are faster and softer. |
| Beam guides | **auto** shows guides at **guides** quality only; **on** and **off** show or hide them at every level. |

| Level  | What you see |
| ------ | ------------ |
| guides | The stage unlit, with beam guides. For computers without a usable graphics card. |
| low    | Light on the floor. |
| medium | Light on every lit surface, at reduced resolution. |
| high   | Light on every lit surface, at full resolution. |

Beam guides are thin lines in each beam's colour: the beam's centre line from the lens to the floor, its edges, and the outline of its footprint on the floor. They stay sharp at any resolution. A fixture with its dimmer at 0 keeps a faint guide, so you can set its position without opening the dimmer.

> **Note:** Nothing is redrawn while nothing changes, so an idle visualizer costs almost nothing. Fog turbulence, strobes and rotating gobos keep it drawing.

### Global Scene Illumination

Global scene illumination may be adjusted to fit your needs. 

| Setting    | Description             |
| ---------- | ----------------------- |
| brightness | Global scene brightness |

> **Note:** High global illumination values might decrease lighting emulation and volumetric's visibility.

### Fogging

Global scene fogging may be adjusted to fit your needs through the following list of settings. 

| Setting    | Description                                         |
| ---------- | --------------------------------------------------- |
| Disabled   | Whether to disable fogging emulation totally or not |
| Density    | Global scene fog density                            |
| Turbulence | Fog dispplacement over time                         |

> **Note:** Fogging emulation is computational heavy and may result in rendering performance loss.
