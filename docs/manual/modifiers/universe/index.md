

# Universe Modifier

Universes can be setup and modified through the Universe [Modifier](/manual/interface/modifiers/). This modifier comes with a set of widgets that allow for fixture [patching](#fixture-pool), [setup](#settings) and [positioning](#position). It also comes with a set of widgets which purpose is to edit a seleced fixture's channel on the fly. 

<Video src="/interface/modifier_universe_4.webm"/>


## Universe Settings

The [Universe Settings](#universe-settings) widgets offers a way to setup and customize universes settings on the fly.

<Video src="/interface/modifier_universe_settings_widget.webm"/>


| Setting | Description                                        |
| ------- | -------------------------------------------------- |
| Name    | The universe's nickname                            |
| Color   | The universe's associated color (purely aestethic) |
| ID      | The universe's unique identifier                   |

## Fixture Pool

Similarly to The [patch bay](/manual/interface/patchbay), the fixture pool widget contains holds a reference to the list of the displayed universe's patched fixtures. 

### Adding Fixtures

The add button allows for new fixtures to be patchied allong the universe's fixture list. For further information please see [Patching Fixtures](/manual/workflow/patch/) under the workflow section.

<img style="border-radius:5px" src="/interface/patch_bay_add_fixture.png" alt="patch bay" width="300"/>

### Selecting Fixtures

One or many fixtures may be selected for deletion. to do so, you may either hold the <kbd>`Ctrl`</kbd> key and select multiple individual list entries or start by clicking on the first list entry index to be selected and select a second entry while holding the <kbd>`Shift`</kbd> key, thus resulting in the selection of every fixture in between these two indices.

<Video src="/interface/modifier_universe_fixturepool_widget_select.webm"/>


### Filtering Fixtures

Once patched, universe's fixtures may be filtered by inputing a search string within the Search Items textbox.

<Video src="/interface/modifier_universe_fixturepool_widget_filter.webm"/>


### Deleting Fixtures

Once fixtures are selected, you may delete every selected entry by pressing the <kbd>`Del`</kbd> or <kbd>`Backspace`</kbd> key. You will then be prompted with a validation popup. Deleting a universe's fixture will automatically remove the references to the specified fixture(s) instance(s) throughout the whole show.

<img style="border-radius:5px" src="/interface/patch_bay_delete_fixture.png" alt="delete fixture" width="400"/>

## Fixture Settings

A selected fixture's [Settings](#fixture-settings) can be modified by modifying values in the fixture settings widget.

<Video src="/interface/modifier_universe_fixture_settings_widget.webm"/>


| Setting | Description                           |
| ------- | ------------------------------------- |
| Name    | The fixture's nickname                |
| Address | The fixture's address on the universe |
| Mode    | The fixture's operating mode          |

## Fixture Position Tool

While a fixture can be positionned through the [visualizer's tranform controls](/manual/interface/visualizer/#transform-controls) feature, it's position may be fine-tuned by using the [universe modifier's](#universe-modifier) position tool widget. Fixture's position in space can be specified with cm accuracy while rotation in every axes can be specified in steps of 1 degrees.


## Fixture Channels
A selected fixture's [channels](#fixture-channels) can be modified on the fly by playing around with the channel faders available through the [channels widget](#fixture-channels).

<Video src="/interface/modifier_universe_fixture_channels_widget.webm"/>


> **Note** Fixture channels modified using the [Universe Modifier](#universe-modifier) can only be manipulated live. Set values cannot be stored nor exported. Please refer to the [Group Modier](/manual/modifiers/group) in order to learn how to create registerable cues.

### Supported Channel Types

All channel types are virtually supported. However, some might not have been implemented yet for visualization. Thus meaning that values will be sent through but wont be emulated in the [visualizer](/manual/interface/visualizer).

| Channel Type         | Description                       | Visualizer | Notes                      |
| -------------------- | --------------------------------- | :--------: | -------------------------- |
| No Function          | No data                           |     ✅      |                            |
| Shutter Strobe       | Shutter strobe                    |     ✅      |                            |
| Strobe Speed         | Strobe Speed                      |     ✅      |                            |
| Strobe Duration      | Strobe Duration                   |     ✅      |                            |
| Intensity            | Dimmer/Brightness                 |     ✅      |                            |
| Color Intensity      | Color Channel Intensity           |     ✅      | Supported: **R,G,B,C,M,Y** |
| Color Preset         | Color preset selection            |     ✅      |                            |
| Color Temperature    | Color temperatrue                 |     ✅      |                            |
| Pan                  | Pan                               |     ✅      |                            |
| Pan Continuous       | Continuous panning speed          |     ⬜️      |                            |
| Tilt                 | Tilt                              |     ✅      |                            |
| Tilt Continuous      | Continuous tilting Speed          |     ⬜️      |                            |
| Pan TiltSpeed        | Pan & Tilt speed selection        |     ⬜️      |                            |
| Wheel Slot           | Wheel selection                   |     ✅      | Supported: **Color wheel** |
| Wheel Shake          | Wheel slot shaking                |     ⬜️      |                            |
| Wheel SlotRotation   | Full wheel roration               |     ⬜️      |                            |
| Wheel Rotation       | Wheel slot rotation               |     ⬜️      |                            |
| Effect               | Fixture built-in effect selection |     ⬜️      |                            |
| Beam Angle           | Beam angle value                  |     ✅      |                            |
| Beam Position        |                                   |     ✅      |                            |
| Effect Speed         | Effect speed selection            |     ⬜️      |                            |
| Effect Duration      | Effect duration                   |     ⬜️      |                            |
| Effect Parameter     | Effect parameter                  |     ⬜️      |                            |
| Sound Sensitivity    | Fixture sound sensitivity         |     ⬜️      |                            |
| Focus                | Focus distance                    |     ✅      |                            |
| Zoom                 | Zoom / Beam angle                 |     ✅      |                            |
| Iris                 | Iris  Opening                     |     ⬜️      |                            |
| Iris Effect          | Fixture built-in iris effect      |     ⬜️      |                            |
| Frost                | Frosting                          |     ⬜️      |                            |
| Frost Effect         | Fixture built-in frosting effect  |     ⬜️      |                            |
| Prism                | Prism selection                   |     ⬜️      |                            |
| Prism Rotation       | Prism rotation speed              |     ⬜️      |                            |
| Blade Insertion      | blade selection / insertion       |     ⬜️      |                            |
| Blade SystemRotation | blade rotation selection          |     ⬜️      |                            |
| Fog                  | Fogging                           |     ⬜️      |                            |
| Fog Output           | Fogging                           |     ⬜️      |                            |
| Fog Type             | Fogging type selection (Fog/Haze) |     ⬜️      |                            |
| Rotation             | Generic rotation                  |     ✅      |                            |
| Speed                | Generic speed                     |     ✅      |                            |
| Time                 | Generic time                      |     ✅      |                            |
| Maintenance          | Maintenance                       |     ⬜️      |                            |
| Generic              | No type-specific properties.      |     ⬜️      |                            |

## Color Picker

The color picker widget can be used to manipulate a fixture's [color intensity channels](#supported-channel-types). Color systems can differ from one fixture to another (RGB, CMY, HSV...). To ease color manipulation, the chosen color value is automatically converted to match the fixture's color system.

<Video src="/interface/modifier_universe_colorpicker_widget.webm"/>


### Modes
For ease of use, the GUI responsible for color transformation is based around the [HSB/HSL color system](https://en.wikipedia.org/wiki/HSL_and_HSV). Hue can be selected by dragging the cursor around the perimeter of the wheel. Saturation value is relative to the radius value between the wheel's center and it's edge.

Color values can also be inputed manually through the widget's input. You may opt to switch between different color systems in order to manually input the color of your choice. The color value wil automatically converted to be interpreted correctly by the selected fixture.

<!-- ::: warning
This color picker does not scale color intensities based on the  [CIE 1931 RGB color space](https://en.wikipedia.org/wiki/CIE_1931_color_space). It considers that every fixture color intensity capabilities are ideal.
::: -->

## Pan & Tilt

A fixture's Pan and Tilt values may be adjusted manually by using the [Pan & Tilt](#pan--tilt) widget.

<Video src="/interface/modifier_universe_pantilt_widget.webm"/>


### Fine Adjustments

When enabled, the "Set fine channels" feature allows for Pan & Tilt fine tuning. Fine pan and tilt values may be finely adjusted through a range of 255 values for each actual step.

::: warning
Fine channel adjustment will only be applied to fixtures which come with fine Pan & Tilt channels.
:::