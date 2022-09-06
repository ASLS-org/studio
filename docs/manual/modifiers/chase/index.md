# Chase Modifier
Chases are collections of group predefined [cues](/manual/modifiers/group) (effect and scenes) which can be arranged to be triggered sequentially or in parallel over time. They can be triggered to run a single time (one shot) or in a loop. Chases can be quantized at will to guarantee on-sync trigger.

The chase modifier allows for quick and easy chases definition through a timeline-based cue definition.  

<Video src="/interface/modifier_chase.webm"/>


## Chase Settings
A chases settings may be edited at will through the chase settings widget. It comes with the same feature set as the group modifier such as color and name definition as well as chase-specific features.

| Setting  | Description                                                                   |
| -------- | ----------------------------------------------------------------------------- |
| Name     | The chase's name                                                              |
| Color    | The chase's color                                                             |
| Duration | The chase's duration in [bars](https://en.wikipedia.org/wiki/Bar_(music))     |
| Quantize | Chase [quantization](https://en.wikipedia.org/wiki/Quantization_(music)) value in [bars](https://en.wikipedia.org/wiki/Bar_(music)) |
| Trigger  | Chase triggering style (either loop or single-shot)                           |

> **Note:** While the bar duration chosen is not affected by a global BPM value change, the chase's duration in seconds will be increased or decreased in order to match the selected BPM value, thus guarantying that every chases will always be in sync.

## Timeline

The timeline widget is the key element when it comes to chases. It allows for group cues to be sequenced at will over time.

<Video src="/interface/modifier_chase_timeline_widget.webm"/>


### Adding Cue

Cue items can be added at will into the timeline by double-clicking clicking on the cue pool of choice. One or many cue items may be added into a single cue pool. Cue items may be resized and moved horizontally by dragging its container, either from its right side or its center.

### Zooming

Clicking and dragging vertically on the timeline's time header allows for zoom definition. The timeline's zoom may be reset by double-clicking its time header.

### Folding Cues

Empty cue pools will be shown or hidden by toggling the **fold cues** button on or off. This allows for greater visual feedback when dealing with great amount of cues.

### Deleting Cue

Left clicking a cue item will remove it from the cue pool. 