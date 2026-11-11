# Installation

Studio comes in two versions with the same interface and the same showfiles. Pick the one that
fits what you're doing; you can switch at any time.

| | In the browser | Desktop app |
| --- | --- | --- |
| **Best for** | Trying Studio, programming anywhere | Running shows on real lights |
| **Get it** | Open the <ResourceLink to="demo">live demo</ResourceLink> | [Download it](#desktop-app) for macOS, Windows or Linux |
| **Real lights** | Also run the gateway on your computer ([Outputs](/rig/outputs)) | The gateway is built in |
| **Your current show and imported fixtures** | Kept in this browser | Kept in the app |
| **Updates** | Always the latest | Download the new release |

A show and imported fixtures don't move between the two by themselves: export the showfile and
keep the `.gdtf` files ([Moving a show](/rig/showfiles#moving-a-show-to-another-computer)).

::: warning Beta software
Studio is in beta: [Known limitations](/reference/limitations) lists what doesn't work yet.
Please report problems on the <ResourceLink to="issues">issue tracker</ResourceLink>.
:::

## What You Need

| | Minimum | Recommended |
| --- | --- | --- |
| **Browser** (web version) | A recent Chrome, Edge or Firefox with WebGL 2 | Chrome or Edge |
| **Memory** | 4 GB | 8 GB or more |
| **Graphics** | Integrated graphics with WebGL 2 | A dedicated graphics card, for the visualizer's high quality |
| **System** (desktop app) | macOS (Apple silicon), Windows or Linux, 64-bit | |

A slow computer still runs Studio: lower the visualizer's quality in
[its settings](/interface/visualizer/#settings). Without WebGL the visualizer can't run; the rest
of Studio works.

## Desktop App

The desktop app is Studio in its own window, with the gateway built in: install it once and it
can drive real lights over Art-Net with nothing else to run.

### Get it

Desktop builds are attached to Studio's releases, on the <ResourceLink to="download">releases
page</ResourceLink>, when a release ships them. Pick the file for your system:

| System | File | Install |
| --- | --- | --- |
| **macOS** (Apple silicon) | `asls_studio-<version>.dmg` | Open it and drag **ASLS Studio** to **Applications** |
| **Windows** (64-bit) | `asls_studio-<version>-setup.exe` | Run it; it adds a desktop shortcut |
| **Linux** | `asls_studio-<version>.AppImage`, `.deb` or `.snap` | AppImage: make it executable and run it. `.deb`: install it with your package manager |

If the latest release has no file for your system, use the browser version in the meantime.

### First launch

The builds aren't signed yet, so your system may warn you the first time. Only do this for files
from the official releases page:

- **macOS:** "ASLS Studio can't be opened because it is from an unidentified developer", or that
  it's damaged. Open **System Settings → Privacy & Security** and press **Open Anyway** next to
  the message about ASLS Studio, then open the app again.
- **Windows:** SmartScreen shows "Windows protected your PC". Press **More info**, then **Run
  anyway**.
- **Linux:** an AppImage needs execute permission: `chmod +x asls_studio-*.AppImage` in a
  terminal, or tick "Allow executing file as program" in its properties.

The first time, Studio opens the demo show.

### The built-in gateway

The app starts the gateway when it opens and stops it when it closes; connect Studio to it as
[Outputs](/rig/outputs#_2-connect-studio-to-the-gateway) explains. If the gateway program can't be
launched, the app shows "Failed to start WSC Gateway": reinstall the app. Don't run a second
gateway of your own next to the app: both want port 4515.

## Next

- New to Studio? Build [your first show](/getting-started/first-show).
- Going to real lights? Read [Outputs](/rig/outputs).

::: details Running Studio from source
To host the web version yourself or contribute, build it from the
<ResourceLink to="repository">source code</ResourceLink>: its README has the steps (Node.js 18,
`npm install`, `npm start`).
:::
