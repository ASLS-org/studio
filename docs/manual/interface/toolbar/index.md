# Navigation Menu

Show properties may be saved, edited and loaded through the toolbar's navigation menu. It is sliced into three subsections:

<Video src="/interface/toolbar.webm"/>


## File Menu

The file menu may be accessed in order to [Create](#new-showfile) [Save](#save-showfile), [Load](#load-showfile), and [Export](#export-showfile) show files.

<img style="border-radius:5px" src="/interface/toolbar_nav_file.png" alt="file menu" width="300"/>

### New Showfile

A new project/showFile can be created by selecting the [New Showfile](#new-showfile) submenu. You will then be prompted with a save popup to export the current showfile changes and a second popup in which the project's/showfile name should be entered.

<img style="border-radius:5px" src="/interface/toolbar_nav_file_new.png" alt="new showfile" width="300"/>

::: warning 
Only one show file may be locally saved at any given time. Please remember to export the data you're currently working on when choosing to [switch](#load-showfile) or [create](#new-showfile) new showfiles.
:::

### Load Showfile

A previously exported showfile may be restored by using the [Load Showfile](#load-showfile) submenu. Current version of ASLS Studio allows for [JSON](https://www.json.org/json-en.html) formated [ASLS standard]() showfiles and [QLC+](https://www.qlcplus.org/) showfiles.

<img style="border-radius:5px" src="/interface/toolbar_nav_file_load.png" alt="load showfile" width="300"/>

::: warning 
While supported, QLC+ showfiles do not contain any information relative to fixture position in 3D space and [fixture groups](/workflow/grouping/) (as designed by ASLS Studio). Moreover, fixture library might differ from one software to another thus resulting in conflicts during import process.
:::

### Save Showfile Locally

Show data may be [saved locally](#save-showfile-locally) by clicking the save button or simply by hitting the associated shortcut <kbd>`Ctrl+S`</kbd>. Data will be saved in the the browser's local storage and presisted locally until the navigator's cache is manually cleared.

<img style="border-radius:5px" src="/interface/toolbar_nav_file_save.png" alt="save showfile" width="300"/>

::: warning 
Please note that locally saved data will be **`cleared`** whenever the navigator's cache is deleted. Moreover, only one show may be locally saved at any given time. Thus meaning that saving over a new or imported show will result in an **`override`**  of the previously saved data. In order to keep a project copy, you will need to [Export Showfile](#export-showfile) the current project. 
:::

### Export Showfile

In order to keep a persistent copy of your project, you may choose to generate and export a show file which can later be restituted by using the [load](#load) menu. To do so, either click on the [Export Showfile](#export-showfile) submenu or hit the associated shortcut hitting the associated shortcut <kbd>`Ctrl+Shift+S`</kbd>.

<img style="border-radius:5px" src="/interface/toolbar_nav_file_export.png" alt="export showfile" width="300"/>

::: info
Undo and Redo are not available in this version of ASLS Studio. Remember to [save](#save-showfile-locally) or [export](#export-showfile) your show regularly.
:::

## Preferences Menu

Show preferences may be adjusted from the [preferences](#preferences-menu) menu.

<img style="border-radius:5px" src="/interface/toolbar_nav_preferences.png" alt="preferences menu" width="300"/>

### Visualizer 

You may want to edit some of the [visualizer's](/interface/visualizer/) properties, either for aesthetic reasons or due to performance issue. You can do so through the `preferences > visualizer` submenu or simply by hitting the <kbd>`Ctrl+Shift+V`</kbd> shortcut keys. Please refer to the [Visualizer Settings](/interface/visualizer/#settings) section for further information regarding the list of the visualizer's editable preferences

<img style="border-radius:5px" src="/interface/toolbar_nav_preferences_visualizer.png" alt="visdualizer preferences" width="300"/>

<!-- TODO media: recapture toolbar_nav_preferences_visualizer.png with the Quality section -->
<br>

#### Fixture Library

::: info WIP
Fixture list is not editable in this version of thge software
:::

<img style="border-radius:5px" src="/interface/toolbar_nav_preferences_fixturelib.png" alt="fixture library" width="300"/>
<br>

#### Inputs/Outputs

::: info WIP
I/O are not editable in this version of thge software
:::

Output keeps running while the show is paused or stopped: pausing freezes cues and chases, but connected devices keep receiving the current channel values, and any fader you move is sent right away.

<img style="border-radius:5px" src="/interface/toolbar_nav_preferences_io.png" alt="Inputs/Ouputs" width="300"/>