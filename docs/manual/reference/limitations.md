# Known Limitations

Studio is in beta. This page lists what doesn't work yet in this release, and how to work around
it. The rest of the manual only describes what works. Found something else? Report it on the
<ResourceLink to="issues">issue tracker</ResourceLink>.

## Outputs

| What doesn't work | Workaround |
| --- | --- |
| **sACN**: the bundled gateway doesn't send it yet, and shows no error | Use Art-Net; most sACN nodes also accept Art-Net |
| **DMX512** (USB and serial interfaces), **KiNET**, **Modbus**, **OSC** and **Raw** aren't verified yet | Prefer an Art-Net node |
| Studio can't tell which protocols a gateway supports, so it offers them all | Check [What's verified](/rig/outputs#what-s-verified) |

## Programming

| What doesn't work | Workaround |
| --- | --- |
| In **Scene Fixtures**, <kbd>Ctrl</kbd>+click selecting several fixtures doesn't work in a group's first cue (the one selected when the group opens) | Set that cue's fixtures one at a time |
| A cue made for **Intensity** doesn't dim fixtures with no dimmer channel (RGB-only PARs, pixel bars): their brightness is their colour | Use a **Colour** cue for them |
| Opening a scene of a group whose fixtures aren't the show's first ones can log an error | The scene panel works anyway |

## Patch Bay

| What doesn't work | Workaround |
| --- | --- |
| A universe can't be deleted (deleting in the patch bay removes the selected fixtures only) | Leave the universe empty |

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
