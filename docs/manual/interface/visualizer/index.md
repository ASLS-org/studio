# Visualizer

The visualizer is your rig in 3D, on the right of the window. It is driven by the same values that
go to your lights: every fader, scene, effect and chase shows there as it plays. Use it to:

- **program without the lights**: on a laptop, on the train, before load-in;
- **check what you patched**: each fixture where it hangs, pointing the right way;
- **see what a cue does** before you play it on stage, and show it to others (record a clip).

Here is the manual's demo rig, four moving heads 6 m up, playing *Warm wash* and *Sunset*. Every
preview of this manual that sits next to a 3D view uses the same visualizer.

<LivePreview preset="scene-stage" />

## Moving Around

| To | Do |
| --- | --- |
| Orbit around the stage | Drag with the left mouse button |
| Move the view (pan) | Drag with the right mouse button: the point you orbit around moves too |
| Zoom | Scroll |

Try it on the demo rig: drag, scroll, then look at the beams from the side to see how far they
fan out.

<LivePreview preset="visualizer" />

In Studio's visualizer header:

| Button | Description |
| --- | --- |
| **auto-focus** | When on, selecting fixtures flies the camera to them |
| **auto-rotate** | Turns the camera slowly around the stage, for a showcase |
| **record** | Records the view as a video (WebM), downloaded when you click it again; the timer shows the length |
| **Hide** | Folds the visualizer to give the group pool the room; click its icon to bring it back |

## Placing Fixtures

Fixtures you select in the patch bay or a fixture pool are outlined in the visualizer, with the
**transform controls** on them. Drag the controls to move or turn the fixtures on stage; the change
is written to their **Position** and **Rotation** when you release the mouse. Keys switch the
controls:

| Key | Mode | Controls |
| --- | --- | --- |
| <kbd>T</kbd> | Move | An arrow per axis (X red, Y green, Z blue) and a square per plane: drag one to slide along it |
| <kbd>R</kbd> | Rotate | A ring per axis: drag one to turn around it |
| <kbd>H</kbd> | Hidden | Only the outline: select without risking a drag |
| <kbd>Esc</kbd> | | Clears the outline |

Watch them on the demo rig: *MAC Aura 2* is selected in the patch bay, then each mode in turn. In
Studio, or the <ResourceLink to="demo">live demo</ResourceLink>, drag an arrow to move it along
the truss.

<LivePreview preset="visualizer-modes" />

Select several fixtures (<kbd>Ctrl</kbd>+click) to move them together, as one block: handy to
shift a whole truss. For exact values, type them in the universe view's
[Position Tool](/programming/patching#fixture-settings-and-position) instead.

## What It Draws

### Fixtures

Every patched fixture shows in the view. GDTF fixtures are drawn from their own description: their
body, pan and tilt axes and every beam or cell sit where the fixture places them. Bodies follow the
fixture's parts: a base, yoke and head for moving heads, a can for PARs and profiles, a scanner
body, a bar or a panel, each sized like the real fixture. Fixtures from the Open Fixture Library
get the same parts, built from their type and size.

GDTF fixtures you import with their own 3D models show the manufacturer's parts instead: the real
base, yoke and head, each sized and placed as the file describes. A part whose model is missing or
doesn't match the fixture's size keeps the generated part. The models come only from the GDTF files
you imported on this computer: they aren't saved in the showfile, so a show opened on another
computer shows them once the same fixtures are imported there. The generic GDTF fixtures bundled
with Studio have no models of their own.

Multi-cell fixtures (LED washes, pixel bars, multi-beam bars) light each cell in its own colour.
The light they cast on the floor and in the haze combines neighbouring cells into a few beams, so
large rigs stay smooth. Cells a fixture describes as glowing rather than projecting (LED pixels,
panels) light up without casting beams in the haze; they spill a soft glow on the floor and walls
around them, in the colours of the nearest cells.

> **Note:** The visualizer doesn't show blades, animation wheels or built-in fixture effects. If
> a fixture has several gobo wheels, only its first one is shown.

### Light on Stage

Each beam lights the floor where it lands, in its colour and intensity, and with the shape of its
field angle: watch the pools change size as the demo heads zoom between *Warm wash* and *Sunset*.
Gobos show in the light: GDTF fixtures project their real gobo images; other fixtures use a
built-in set of patterns, picked by the gobo wheel slot. Gobo rotation and the gobo index turn the
pattern, frost and focus blur it, and the iris narrows the beam. A prism splits the beam into its
facets (three when the fixture doesn't describe them) and turns with the prism rotation. Colour
temperature (CTO, CTB) warms or cools the light.

Each fixture's brightness follows its light output: a 20,000 lm spot lights the floor and the haze
more than a 2,000 lm PAR at the same dimmer. The cells of a multi-cell fixture share its light.
Fixtures whose file gives no light output are estimated from their power.

### Beams in the Air

Beams show in the air through haze: brightest near the lens, fading with distance, and stopping at
the floor. A beam starts as wide as its lens; narrow beams keep a bright shaft longer than washes,
and a strong beam pales toward white at its neck, as on camera. At **high** quality the gobo shows
in the haze as shafts of light that match the pattern on the floor. Lit fixtures glow at the lens,
and at **medium** and **high** quality bright beams and lenses get a soft bloom.

## Settings

Open them from **Preferences** in the [toolbar](/interface/toolbar/#preferences-menu). Changes show
at once, so set them with a look playing.

### Quality

Quality settings belong to the computer you're on, not to the show: they are kept across reloads
and aren't saved in the showfile, so the same show can run at **high** on a desktop and at **low**
on a laptop. Changing them doesn't mark the show as unsaved.

| Setting | Description |
| --- | --- |
| Quality | **auto** picks a level from the computer's graphics and adapts it while you work: when frames get slow it lowers the lighting resolution, then the level, and raises them again once there's time to spare. Choose a level to fix it. |
| Lighting resolution | Resolution of the stage lighting when quality isn't **auto**: **100%**, **75%**, **50%** or **35%**. Lower values are faster and softer. |
| Render resolution | Resolution of the whole view: **50%**, **80%** (default) or **100%**. Higher is sharper and slower; it applies at every quality level, also with **auto**. |
| Beam guides | **auto** shows guides at **guides** quality only; **on** and **off** show or hide them at every level. |

| Level | What you see |
| --- | --- |
| guides | The stage unlit, with beam guides, and no beams in the air. For computers without a usable graphics card. |
| low | Light on the floor, plain beams in the air and lens glow. Beams aren't hidden behind fixtures. |
| medium | Light on every lit surface at reduced resolution; beams in the air softened by their gobo; bloom. |
| high | Light on every lit surface at full resolution; gobo shafts in the beams; bloom. The manual's previews run at high. |

With **auto**, the visualizer first lowers the detail of the beams in the air at **high**, then the
resolution, then the level.

Fixture models follow the level too. **guides** and **low** use the file's low detail models,
**medium** its standard ones and **high** its high detail ones, each falling back to the nearest
detail the file has. A fixture whose models are too detailed for the level shows its generated
parts at that level, so a large rig stays smooth on a slow computer. A fixture you've just patched
shows its generated parts for a moment while its models load.

Beam guides are thin lines in each beam's colour: the beam's centre line from the lens to the
floor, its edges, and the outline of its footprint on the floor. They stay sharp at any resolution.
A fixture with its dimmer at 0 keeps a faint guide, so you can set its position without opening the
dimmer.

> **Note:** Nothing is redrawn while nothing changes, so an idle visualizer costs almost nothing.
> Strobes and rotating gobos keep it drawing.

### Illumination

| Setting | Description |
| --- | --- |
| Global Brightness | Brightness of the stage where no beam lights it. |
| Exposure | Brightness of the beams and the light they cast, in %, saved with the show. **100** is physically accurate: wide beams look dimmer than narrow ones, as on a real stage. Raise it for a more readable view, lower it for a darker room. |

> **Note:** High global brightness makes the beams' light harder to see against the stage.

### Haze

Haze is what makes beams visible in the air: one even haze across the stage, saved with the show.

| Setting | Description |
| --- | --- |
| Density | How bright beams look in the air, 0 to 100. **0** hides beams in the air; light on the floor stays. |

> **Note:** Shows saved before haze existed open with a density of 50.

## Performance Tips

- On a laptop, start at **auto**; if the view stutters while you program, pick **low**.
- Lower **Render resolution** before **Quality**: the picture stays rich, only softer.
- **Hide** the visualizer while you edit long timelines on a small screen; playback doesn't need it.
