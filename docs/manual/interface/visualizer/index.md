# Visualizer

ASLS's WebGL based visualizer enables users to visualize and monitor fixtures activity in a 3D environment. It also enables users to interact with fixtures in order to [position](controls) them through simple and intuitive draggable interfaces.

> **_NOTE:_** Currently implemented visualizable fixtures only  include moving heads. Regarding visualizing capabilities, the 3D engine is currently capable of emulating most fixture channels capabilities **EXCEPT:** *Gobos, Multi-Color wheel slots, Multi-bulbs (rendered as single bulb), blading system and any non-standard capabilities*.

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

The visualizer is highly cutomizable and allows users to interact with its features live. Please refer to the [Toolbar Preferences](/manual/interface/toolbar/#preferences-menu) section for further information opn howw to access visualizer preferences.

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

### Volumetrics

Global scene fogging may be adjusted to fit your needs through the following list of settings. 

| Setting | Description                   |
| ------- | ----------------------------- |
| quality | Volumetrics rendering quality |

> **Note:** Lowering quality for large amount of volumetrics might improve rendering performances greatly.

### Lighting

Global scene fogging may be adjusted to fit your needs through the following list of settings. 

| Setting             | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| Disabled            | Whether to disable lighing emulation totally or not        |
| Physically accurate | Whether to enable physically accurate lighting attenuation |