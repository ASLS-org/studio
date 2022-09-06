# Group Modifier

Groups are used to create and manage and distribute cues over a set of given fixtures. The group modifier comes with a set of widgets that allow for [cue definitions](#creating-cues) such as [scenes](#scenes) and [effects](#effects). Fixtures that are patched in a [group](/manual/interface/gropuppool) may come from different universes, thus allowing for cues to be distributed over the show's ntire set of fixtures. 

<Video src="/interface/modifier_group.webm"/>

## Group Settings

[Group settings](#group-settings) are very basic. They offer a way to visually differentiate one group from another by attributing it with a unique name and color.

<Video src="/interface/modifier_group_settings_widget.webm"/>


## Fixture Pool

Similarly to The [patch bay](/manual/interface/patchbay), the fixture pool widget holds a reference to the list of fixtures patched in a group. 

### Adding Fixtures

The add button allows for new fixtures to be added into the group's fixture list.

<img style="border-radius:5px" src="/interface/patch_bay_add_fixture.png" alt="patch bay" width="300"/>

### Selecting Fixtures

One or many fixtures may be selected for deletion. to do so, you may either hold the <kbd>`Ctrl`</kbd> key and select multiple individual list entries or start by clicking on the first list entry index to be selected and select a second entry while holding the <kbd>`Shift`</kbd> key, thus resulting in the selection of every fixture in between these two indices.

<Video src="/interface/modifier_universe_fixturepool_widget_select.webm"/>


### Filtering Fixtures

Once patched, group's fixtures may be filtered by inputing a search string within the Search Items textbox.

<Video src="/interface/modifier_universe_fixturepool_widget_filter.webm"/>


### Deleting Fixtures

You may delete every selected fixture from  a group by pressing the <kbd>`Del`</kbd> or <kbd>`Backspace`</kbd> key. You will then be prompted with a validation popup. Deleting a group's fixture will automatically remove the references to the specified fixture(s) instance(s) throughout the whole group.

<img style="border-radius:5px" src="/interface/patch_bay_delete_fixture.png" alt="delete fixture" width="400"/>

## Cue Pool

The [cue pool](#cue-pool) holds a reference to each individual cues that are part of a group. It provides users with a way to [create](#creating-cues), [edit](#editing-cues) and [trigger](#running-cues) cues. Cue pools can hold up to 120 unique cues.

<Video src="/interface/modifier_group_cuepool_widget.webm"/>


### Creating Cues

Cues can be created at will by double-clicking on a cuepool's empty slot, prompting the user with a cue creation popup.

<Video src="/interface/modifier_group_cuepool_popup_add.webm"/>
  
The cue creation popup allows for cue type selection ([scene](#scenes) or [effects](#effects)), as well as name definition and color attribution. While a cues' name and color may be modified later through the [cue settings](#cue-settings) widget, the cue's type cannot be modified. 


#### Scenes
Scenes are cues which allow the control of one or many fixture's channels by providing each with a set of preset values which will be set (gradually or not) on scene cue. For further information regarding scene definition and management please refer to the [creating scenes](/manual/workflow/creaing-scenes) workflow section.

#### Effects
Effect are cues which allow for parametric modulation of a fixture's channel over time. For further information regarding effect definition and management please refer to the [creating effects](/manual/workflow/creaing-effects) workflow section.

### Editing Cues

Cues can be selected for modification by clicking on a cue's footer section within the cuepool. You may also opt to both [run](#running-cues) and [select](#editing-cues) the cue for edit by clicking on a cue's body (cue section containing the cue type icon). cues may be reordered by dragging and dropping them in any of the cuepool's empty spot.

<Video src="/interface/modifier_group_cuepool_widget_edit.webm"/>


### Running Cues

A cue's running state may be toggled on or off by clicking its body (cue section containing the cue type icon). Once in running mode, tha cue's progress over time can be visualized within the cue's body. It's playing state is given by hovering the mouse cursor over the cue's body. The overview section of the cue pool allows for quick identification of running cues without the need for the container to be scrolled through. Playing cues can be easily identified thanks to their blinking animation.

<Video src="/interface/modifier_group_cuepool_widget_play.webm"/>

### Deleting Cues

A selected cue may be deleted by pressing the <kbd>`Del`</kbd> or <kbd>`Backspace`</kbd> key. You will then be prompted with a validation popup. Deleting a group's cue will automatically remove the references to the specified cue(s) instance(s) throughout the whole show.


## Cue Settings

Every cue type comes with a similar set of features that can be edited through the [cue settings](#cue-settings) widget. These features define the cue's triggering and playing behavior, both when manually played through the cuepool widget's [running cues](#running-cues) feature or automatically played in group [chases](/manual/modifier/chase/).

<Video src="/interface/modifier_group_cue-settings_widget.webm"/>

| Setting       | Description                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Name          | The cue's nickname                                                                                                        |
| Color         | The cue's associated color (purely aestethic)                                                                             |
| Loop Style    | The cue's looping style can either be single shot (triggered once) or loop (infinitely)                                   |
| Trigger Style | The cue's trigger style can either be temporary (button down) or toggle (click to toggle on/off)                          |
| Start         | Whether the cue's starting point should be relative from the current fixture channel values or absolute (start from zero) |
| Duration      | The cue's duration in [bars](https://en.wikipedia.org/wiki/Bar_(music))                                                   |

> **Note**: A scene's looping style will cannot be defined to other than single shot.

## Scene Widgets

Scene cues can be edited and manipulated through the scene-specific widgets listed below.

- [Fade Editor](#fade-editor)
- [Scene Fixtures](#scene-fixtures)
- [Fixture Channels](#scene-fixture-channels)
- [Color Picker](#color-picker)
- [Pan & Tilt](#pan--tilt)

### Fade Editor

Fade editor is a **scene-specific** widget. It allows to define a scene's fade-in/out easing function. It is based around the [Bézier curve](https://en.wikipedia.org/wiki/B%C3%A9zier_curve) which allows for both starndard and custom easing function definition.

<Video src="/interface/modifier_group_fade-editor_widget.webm"/>

> **Note:** Manipulating control point values manually, either through the `CP?X/Y` or the curve editor will automatically set the selected preset to "custom".

#### Presets

Presets can be used in order to define a scene's fade-in/out easing functions presets. For further information regarding easing functions you may have a look at https://easings.net/.

| Setting     | Description                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| Custom      | Control points are user-defined                                                                                           |
| Linear      | The cue's associated color (purely aestethic)                                                                             |
| Ease        | The cue's looping style can either be single shot (triggered once) or loop (infinitely)                                   |
| Ease In     | The cue's trigger style can either be temporary (button down) or toggle (click to toggle on/off)                          |
| Ease In Out | Whether the cue's starting point should be relative from the current fixture channel values or absolute (start from zero) |

#### Control Points

In order to define custom easing function, you may either opt to drag the control points `CP1` and `CP2` around or finely define their position values from the `CP?X` and `CP?Y` inputs. Modifying `CP1`'s value will affect the lower section of the curve while manipulating `CP2` will affect its higher section. for further information regarding Bézier curve and the definition of its control points, you may have a look at https://cubic-bezier.com/

### Scene Fixtures and channels

Scene Fixtures and channels are scene-specific widgets. they allows for fixtures to be picked in order to display and set their channel values. While single fixtures can be selected, a set of multiple fixtures may be seleted for edition by holding the <kbd>`Ctrl`</kbd> or <kbd>`Shift`</kbd> key. When multiple fixtures are selected, the modifications applied to the channels through the [Fixture Channels](#scene-fixture-channels), [Color Picker](#color-picker) and [pan & tilt](#pan--tilt) widgets will be applied to each individual fixture taht is part of the selection list. Thus allowing for quick scene definitions. The values that are set through the **Channels** widget will be the fixture(s)'s end values once the scene is triggered.

<Video src="/interface/modifier_group_fixture-channels_widget.webm"/>


::: info Note: 
When multiple fixtures are selected, channels displayed within the [Fixture Channels](#scene-fixture-channels) widget is union of each fixture's  channels. In case of union, the values applied to channels that are specific to a fixture will only be applied to that fixture.
|           | Channel List                              |
| --------- | ----------------------------------------- |
| Fixture 1 | `Pan`, `Tilt`, `R`,`G`,`B`,`Zoom`         |
| Fixture 2 | `Pan`, `Tilt`, `R`,`G`,`B`,`Focus`        |
| Both      | `Pan`, `Tilt`, `R`,`G`,`B`,`Zoom`,`Focus` |
:::

::: warning
In order to be selected for scene modulation, a fixture's channel must be defined as active in the scene by toggling the checkbox under its fader as active. When multiple fixtures are selected, toggling on/off a channel from the channel widget will toggle on/off channel activity of each fixtures that are currently being selected;
:::


### Color Picker

The color picker widget can be used to manipulate a fixture's [color intensity channels](#supported-channel-types). Color systems can differ from one fixture to another (RGB, CMY, HSV...). To ease color manipulation, the chosen color value is automatically converted to match the fixture's color system. Similarly to the channels widget, the color picker widget may be used in to set the color value of **one or multiple** selected fixtures at a time.

<Video src="/interface/modifier_universe_colorpicker_widget.webm" style="margin-bottom:16px;"/>


#### Modes
For ease of use, the GUI responsible for color transformation is based around the [HSB/HSL color system](https://en.wikipedia.org/wiki/HSL_and_HSV). Hue can be selected by dragging the cursor around the perimeter of the wheel. Saturation value is relative to the radius value between the wheel's center and it's edge.

Color values can also be inputed manually through the widget's input. You may opt to switch between different color systems in order to manually input the color of your choice. The color value wil automatically converted to be interpreted correctly by the selected fixture.

### Pan & Tilt

A fixture's Pan and Tilt values may be adjusted manually by using the [Pan & Tilt](#pan--tilt) widget. Similarly to the channels widget, the pan & tilt widget may be used in to set the color value of **one or multiple** selected fixtures at a time.

<Video src="/interface/modifier_universe_pantilt_widget.webm" style="margin-bottom:16px;"/>

#### Fine Adjustments

When enabled, the "Set fine channels" feature allows for Pan & Tilt fine tuning. Fine pan and tilt values may be finely adjusted through a range of 255 values for each actual step.

::: warning
Fine channel adjustment will only be applied to fixtures which come with fine Pan & Tilt channels.
:::

## Effect Widgets

Effect cues can be edited and manipulated through the effect-specific widgets listed below.

- [Modulated Channels](#modulated-channels)
- [Channel Fixtures Activity](#channel-fixtures-activity)
- [Effect Tool](#effect-tool)

### Modulated Channels

Modulated channels are effect channels that are bound to a waveform which will rule the channel's value over time. While every type of channel could virtually be modulated, restricting modulation to a narrower list of logically modular channels makes more sense. In this sense, ASLS Studio offers a limited, yet broad list of modular channels and introduces modulation presets for each of these channels.

| Channel Type         | Description                 | Supported | Notes                      |
| -------------------- | --------------------------- | :-------: | -------------------------- |
| Shutter Strobe       | Shutter strobe              |     ✅     |                            |
| Intensity            | Dimmer/Brightness           |     ✅     |                            |
| Color Intensity      | Color Channel Intensity     |     ✅     | Supported: **R,G,B,C,M,Y** |
| Pan                  | Pan                         |     ✅     |                            |
| Tilt                 | Tilt                        |     ✅     |                            |
| Wheel Slot           | Wheel selection             |     ⬜️     |                            |
| Wheel SlotRotation   | Full wheel roration         |     ⬜️     |                            |
| Wheel Rotation       | Wheel slot rotation         |     ⬜️     |                            |
| Focus                | Focus distance              |     ✅     |                            |
| Zoom                 | Zoom / Beam angle           |     ✅     |                            |
| Iris                 | Iris  Opening               |     ⬜️     |                            |
| Frost                | Frosting                    |     ⬜️     |                            |
| Prism                | Prism selection             |     ⬜️     |                            |
| Prism Rotation       | Prism rotation speed        |     ⬜️     |                            |
| Blade Insertion      | blade selection / insertion |     ⬜️     |                            |
| Blade SystemRotation | blade rotation selection    |     ⬜️     |                            |

#### Adding Modulated Channels

New modular effect channel can be created by click on the widget's `ADD` button. A popup containing a list of modular channels and presets will be displayed. 

<img style="border-radius:5px" src="/interface/group-pool_modulate-channels_new.png" alt="add modulateed channel button" width="300"/>


> **Note:** Selecting an item from the list will either create and associate a new modular channel to the effect or assign the preset values to channels that may already be existing.


#### Selecting Modulated Channels
#### Removing Modulated Channels

A modular channel can be removed by hitting the the <kbd>`Del`</kbd> or <kbd>`Backspace`</kbd> key once it has been selected. You will then be prompted with a validation popup. Deleting an effect's modular channel will automatically remove the references to the specified modular channel instance(s) throughout the whole effect cue.

### Channel Fixtures Activity

By default, every fixture that is part of a group is added to the list of active fixtures which channels will be affected by the modulated channels associated to an effect. Fixtures can be ommited from each individual modular channel's fixture activity list by toggleing off the fixture's activity checkbox within the channel fixture activity list widget. Running order of fixture can also be rearranged by dragging and dropping fixtures list items around. 

### Effect Tool

The effect tool is used to configure a selected modular channel's waveform and fixture phase distribution. It helps configure and visualise the modulation that will actually be applied to the seleted channel.

<Video src="/interface/modifier_group_effect-tool_widget.webm"/>

This widget is highly configurable and comes with many features:

| Feature     | Description                                                                       |
| ----------- | --------------------------------------------------------------------------------- |
| Waveform    | Waveform type (`SINE`,`TRIANGLE`,`SQUARE`)                                        |
| Min         | Waveform's minimum value                                                          |
| Max         | Waveform's maximum value                                                          |
| Freq        | Waveform frequency between 0 and 10Hz                                             |
| Phase       | Waveform phase shift                                                              |
| Direction   | Direction of the channel animation (`Left To Right`,`Right To Left`,`Symetrical`) |
| Phase Start | Phase shift value of the first fixture in the activity group                      |
| Phase Stop  | Phase shift value of the last fixture in the activity group                       |

> **Note:** Phase shifting for fixture that are in between the start/stop interval is automatically calculated to be spread around evenly between the whole channel's active fixtures.