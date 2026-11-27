# Troubleshooting

Find what you see in the tables below: each row gives the likely cause and the fix. If none fits,
check [Known limitations](/reference/limitations), then ask in the
<ResourceLink to="discussions">discussions</ResourceLink> or report it on the
<ResourceLink to="issues">issue tracker</ResourceLink>.

## Outputs

| What you see | Likely cause | Fix |
| --- | --- | --- |
| The gateway stays **Connecting**, or keeps **Reconnecting** | The gateway isn't running, or listens elsewhere | Desktop app: restart it. Browser: start the gateway; Studio connects as soon as it answers. Check **Host** `127.0.0.1` and **Port** `4515` |
| **Connected**, but no light reacts | The universe has no route, or its route isn't forwarding | In **Outputs**, click the universe, then the gateway, then **Add** above Destinations; or check its route in the universe's **Output** widget |
| The wire is green, but no light reacts | Wrong node address, network, or Art-Net universe | Check the route's **Destination**, that your computer is on the node's network, and that the node listens to the route's **Net**, **Subnet** and **Universe** |
| A route is marked **conflict** | Two routes send the same universe number to the same receiver | Give one of them another universe number or destination, or turn it off |
| The OUTPUT dot is red | A gateway has been gone for more than 10 seconds, or reported an error | Open **Outputs**: the gateway's **Log** says what happened |
| Sending, but the wrong lights react, or faders do the wrong thing | Addresses or modes don't match the lights | Check that each fixture's **Ch Start** address (in Fixture Settings) is the one on the light's display (move it with [Repatching](/programming/patching#repatching)) and that its **Fixture mode** is the mode set on the light |
| Nothing goes out over sACN or another protocol | The gateway doesn't send that protocol yet | Use **Art-Net** ([what's verified](/rig/outputs#what-s-verified)) |
| Everything worked, then nothing goes out after reopening the show | The gateway isn't connected yet | Press **Connect** on the gateway, or turn its **Connect on load** on |
| Lights flicker or answer slowly | Two programs send to the same node, or a busy Wi-Fi network | Close the other lighting software; use a cable for the network |

## Fixtures and GDTF

| What you see | Likely cause | Fix |
| --- | --- | --- |
| A light isn't in the fixture list | Not in the built-in library | Search part of its model name (`aura`); else import its GDTF file ([Fixture Library](/rig/fixtures#gdtf-fixtures)) |
| A GDTF import shows an error | The file isn't a valid GDTF fixture | See [the import messages](/rig/fixtures#gdtf-fixtures); download the file again |
| **Missing fixtures** when opening a show | The show uses GDTF fixtures this device hasn't imported | Import their `.gdtf` files in the popup, or **Open anyway** ([details](/rig/fixtures#opening-a-show-with-missing-fixtures)) |
| Imported fixtures disappeared | The browser's site data was cleared, or it's another browser or a private window | Import the `.gdtf` files again |
| A fixture shows in the list but stays dark in the visualizer | Its dimmer or shutter is closed, or it was opened with **Open anyway** | Open its dimmer and shutter in the universe view; import its GDTF file and reopen the show |
| Patching is refused (out of universe bounds) | Not enough free addresses after the one you chose | Pick a lower **Address**, fewer fixtures, or another universe |

## Saving and Showfiles

| What you see | Likely cause | Fix |
| --- | --- | --- |
| My show is gone when I come back | It wasn't saved (**Save Showfile Locally**), or the browser's data was cleared | Open your last exported file; from now on export regularly ([Showfiles](/rig/showfiles#where-your-show-lives)) |
| Studio opens the demo show | First run, another browser, a private window, or cleared data | **Load Showfile** your exported show |
| The `*` stays after saving | Something changed since | Save again with <kbd>Ctrl</kbd>+<kbd>S</kbd> |
| **Load Showfile** did nothing | The file isn't a Studio showfile | Pick a `.json` file exported from Studio |
| "Fixture reference(s) … were dropped" when opening a show | The show listed fixtures it no longer had (left over from an earlier delete) | Nothing to do: the show opens without them and is saved that way. Check your universes and groups |
| A shortcut does nothing on a Mac | Shortcuts use <kbd>Ctrl</kbd>, not <kbd>Cmd</kbd> | Use <kbd>Ctrl</kbd> ([Shortcuts](/reference/shortcuts)) |

## Visualizer

| What you see | Likely cause | Fix |
| --- | --- | --- |
| No 3D view, or a message that WebGL is needed | The browser or graphics driver has WebGL turned off | Enable hardware acceleration in the browser's settings, update the graphics driver, or try Chrome or Edge |
| The view stutters | The computer can't keep up at this quality | Set **Quality** to **auto** or **low**, lower **Render resolution** ([Settings](/interface/visualizer/#quality)) |
| Beams don't show in the air | Haze **Density** is 0, or exposure is low | Raise **Density** and **Exposure** in **Preferences → Visualizer** |
| The camera is lost | It was moved far away | Scroll to zoom out; turn **auto-focus** on and select a fixture to fly to it |

## Desktop App

| What you see | Likely cause | Fix |
| --- | --- | --- |
| macOS says the app is from an unidentified developer or damaged | The build isn't signed | **System Settings → Privacy & Security → Open Anyway** ([First launch](/introduction/installation#first-launch)) |
| Windows says it protected your PC | Same | **More info → Run anyway** |
| "Failed to start WSC Gateway" | The bundled gateway couldn't launch | Reinstall the app |

## FAQ

**Do I need lights to use Studio?** No. The visualizer shows what your lights would do; you can
program a whole show without them and plug the rig in later.

**Which DMX interface should I buy?** An Art-Net node: it's what Studio's gateway sends today.
USB DMX interfaces aren't verified yet.

**Can I use Studio and another lighting program together?** Not on the same lights: both would
send to them. Use one at a time.

**Does the browser version work offline?** Partly: once loaded, the show you're working on keeps
running, but Studio downloads fixture descriptions when it first needs them, so patching new
fixtures and reloading the page need the connection. The desktop app works offline.

**Is my show sent anywhere?** No. Your show stays on your computer (in the browser's or the app's
storage, and the files you export).
