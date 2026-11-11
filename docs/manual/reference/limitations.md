# Known Limitations

Studio is in beta. This page lists what doesn't work yet in this release, and how to work around
it. The rest of the manual only describes what works. Found something else? Report it on the
<ResourceLink to="issues">issue tracker</ResourceLink>.

## Outputs

| What doesn't work | Workaround |
| --- | --- |
| Connections and universe streams aren't saved with the show | After opening a show or reloading Studio, connect again in **Preferences → Outputs** and set each universe's **Output** and **Stream** again |
| The **Config** button next to a universe's **Output** does nothing | Use **Preferences → Outputs** (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd>) |
| **SACN**: the current gateway answers "Unsupported protocol" | Use Art-Net; most sACN nodes also accept Art-Net |
| **DMX512** (USB and serial interfaces), **KINET**, **MODBUS**, **OSC** and **RAW** aren't verified yet | Prefer an Art-Net node |
| **Baud**, **Serial port**, **Priority** and **TTL** may not reach the gateway; changing **Interface** may not take effect until streaming restarts | Keep the defaults; stop and start streaming after a change |
| Deleting a connection can raise an error | Leave unused connections in the list; they're gone after a reload anyway |

## Programming

| What doesn't work | Workaround |
| --- | --- |
| **Trigger Style** is saved but unused: every cue starts and stops on a click; **Temporary** does nothing | Click the cue again to stop it |
| The group pool's **dimmer** knob, **Isolate** and **Blackout**, and the master column's knob and buttons, don't change the output | Stop a group's cues and chases to darken it; keep a dark scene to click |
| Effect waveform **PWM** keeps the channel at its lowest | Use **SQUARE** |
| Effect directions **BOUNCELRT** and **BOUNCERTL** don't spread the fixtures: they all move together | Use **SYM**, **LTR** or **RTL** |
| Chase **Quantize** **1/8**, **1/4** and **1/2** wait 1, 2 and 3 beats rather than the fraction of a bar their names say | Use **1/1** (next bar) or **None** |
| In **Scene Fixtures**, <kbd>Ctrl</kbd>+click selecting several fixtures doesn't work in a group's first cue (the top-left slot) | Set that cue's fixtures one at a time |
| Opening a scene of a group whose fixtures aren't the show's first ones can log an error | The scene panel works anyway |

## Patch Bay

| What doesn't work | Workaround |
| --- | --- |
| **New** does nothing | Patch from a universe's **Fixture Pool**: **Add** |
| <kbd>Delete</kbd> asks for a confirmation, then doesn't delete | Delete from the universe's **Fixture Pool** |
| <kbd>Shift</kbd>+click selects nothing | <kbd>Ctrl</kbd>+click each fixture |

## Visualizer

| What doesn't work | Workaround |
| --- | --- |
| No separate visualizer window for a second screen | Make Studio's window large, or **Hide** the visualizer while editing |
| Blades, animation wheels and fixtures' built-in effects aren't drawn; of several gobo wheels, only the first is drawn | They're still sent to your lights |

## Showfiles

| What doesn't work | Workaround |
| --- | --- |
| No undo | Export the show before big changes ([Showfiles](/rig/showfiles#where-your-show-lives)) |
| Studio keeps one show: a new or opened show replaces it at once | Export the current show first |

## Desktop App and the Rest

| What doesn't work | Workaround |
| --- | --- |
| Desktop builds aren't signed: your system warns on first launch | See [First launch](/introduction/installation#first-launch) |
| A release may not ship a build for every system | Use the browser version in the meantime |
| **About → Manual** always opens the manual's main address | Bookmark the version of the manual you use |
