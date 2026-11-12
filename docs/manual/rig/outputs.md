# Outputs

Studio computes your show as DMX: 512 values per universe, many times a second. To reach real
lights, each universe goes through the **gateway**, a small program that turns Studio's output
into a lighting protocol on your network, such as **Art-Net**. An Art-Net node (or a light that
speaks Art-Net) turns that into DMX on a cable.

<OutputPath />

Getting output going takes three steps: run the gateway, connect Studio to it, then send each
universe through that connection.

## 1. Run the Gateway

| Studio runs | The gateway |
| --- | --- |
| **Desktop app** | Is built in: it starts and stops with the app. Nothing to do |
| **In the browser** | Must run on the same computer. Get it from the [WSC releases](https://github.com/ASLS-org/WSC/releases) (`wsc-server-…` for your system) and start it; leave it running while you work |

The gateway listens for Studio on port **4515**. Your computer and the Art-Net node must be on the
same network, with the node's address reachable (Art-Net nodes often use `2.x.x.x` or
`10.x.x.x` addresses: set your computer's network address to match, as the node's manual says).

## 2. Connect Studio to the Gateway

Open **Preferences → Outputs** (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>O</kbd>). The
**Input/Outputs** popup lists your connections.

1. Press **Add New Connection**. A connection named *New Connection 1* appears, set for a
   gateway on this computer.
2. Check its settings (the defaults fit the desktop app and a gateway on the same computer).
3. Press **Connect**. Its state in the list goes from **Disconnected** to **Connecting…** to
   **Connected**; the log under the settings shows what happens.

<LivePreview preset="outputs-popup" />

| Setting | Description |
| --- | --- |
| **Label** | The connection's name, as the universes list it |
| **Type / Protocol** | **WSC (Web Show Control)**: how Studio talks to the gateway |
| **IP**, **Port** | Where the gateway runs: `127.0.0.1` (this computer) and `4515` |

Press **Disconnect** to close the connection, **Delete** to remove it.

## 3. Send a Universe

Open the universe in the patch bay. In its **Universe** settings, pick the connection as its
**Output**: the **Stream** widget appears next to it, where you say how the gateway sends this
universe.

1. **Protocol**: **ARTNET** for an Art-Net node (see what's verified below).
2. **Host**: the Art-Net node's IP address, and **Port**: `6454`, the Art-Net port (filled in
   when you pick the protocol).
3. Press **Start streaming**. The universe goes out continuously, every frame, whether the show
   is playing or paused. **Stop streaming** stops it.

<LivePreview preset="universe-stream" />

Studio's universe 0 goes out as Art-Net universe 0, universe 1 as 1, and so on: set each node to
the universe it should listen to.

| Setting | Shown for | Description |
| --- | --- | --- |
| **Protocol** | Always | How the gateway sends the universe |
| **Interface** | Protocols with several | The gateway's way out: network (UDP, TCP), serial, USB, WebSocket |
| **Host**, **Port** | Network interfaces | The receiving device's address |
| **Serial port**, **Baud** | Serial | The port's number on the gateway's computer and its speed |
| **Vendor ID**, **Product ID** | USB | The USB interface's identifiers |
| **URL** | WebSocket | The receiver's address (`ws://host:port/path`) |
| **Priority** | sACN | The stream's sACN priority (default 100): the receiver follows the highest |
| **TTL** | UDP | How many network hops packets may cross (0: the gateway's default) |
| **NIC** | UDP, TCP | Which of the gateway computer's network cards sends them (0: the default) |

## Check That It Works

1. Patch a fixture at the address its display shows (minus 1: Studio counts from 0, see
   [Patching](/programming/patching#patch-settings)), in the universe you're streaming.
2. In the universe view, push its dimmer fader up (and open its shutter if it has one).
3. The light should follow. If it doesn't, see [Troubleshooting](/reference/troubleshooting#outputs).

On a computer without lights, an Art-Net monitor (a free app that shows the Art-Net packets on
your network) shows the values Studio sends.

## What's Verified

Checked with the gateway bundled with Studio, sending to an Art-Net receiver on the same
computer: connecting, streaming Art-Net, and the values following faders, scenes and effects.

| Protocol | Status |
| --- | --- |
| **ARTNET** over UDP | Works |
| **SACN** | The current gateway answers "Unsupported protocol": not available yet |
| **OSC** over UDP | The gateway has an OSC sender; not verified with Studio yet |
| **DMX512** (USB or serial interfaces), **KINET**, **MODBUS**, **RAW** | Not verified yet |

> **Note:** In this release, connections and universe streams aren't saved with the show: after
> opening a show or reloading Studio, connect again and set each universe's **Output** and
> **Stream** again. The **Config** button next to **Output** does nothing yet; use
> **Preferences → Outputs**. See [Known limitations](/reference/limitations#outputs).
