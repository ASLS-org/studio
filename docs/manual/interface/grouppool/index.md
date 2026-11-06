# Group Pool
Groups are used to create, manage and distribute cues over a set of given fixtures. Each group's set of fixtures cues and settings can be accessed and modified through the [group modifier](/modifiers/group/). 

<LivePreview preset="group-pool" />

## Creating Groups

New groups may be created by clicking the group pool's header **New** button. 

A popup prompting for fixture selection, group name and color definition will be displayed. Groups may be created without any fixture association. A group's fixture list and settings may be edited later through the [group's modifier](/modifiers/group/) section.

<LivePreview preset="group-pool-new" />


## Editing Groups

Group's setting can be edited directly from the group modifier. A group's modifier is displayed by clicking anywhere on the group that you wish to edit in the [group pool](#group-pool). For further information regarding group modification please refer to the [Group modifier](/modifiers/group/) section.

### Chase pool

Sets of cues may be dispatched and arranged in chases which will be responsible for triggering multiple predefined cues over time. Each individual group may store an indefinite amount of chases. For further information relative to chases please see the [chase modifier](/modifiers/chase/) section. 

<LivePreview preset="group-pool" />

> **Note:**  Only one single chase may be run at a time for each individual group, thus preventing conflicts between  the fixtures channels that are being controlled simultaneously.

#### Creating Chases

A chase can be created by double-clicking on any group's empty chase pool slot. To preserve their infinite behavior, chase pools empty slots will automatically be incremented when new Chases are created. A chase pool may be scrolled down to reveal any chase that might be hidden outside of the container's boundaries.


#### Triggering Chases

Chases' state may be triggered on/off by clicking on a chase's container playstate button. The chase's progress over time and a playing animation will be displayed over its container.

<LivePreview preset="chase-play" />
 

#### Deleting Chases

A selected chase may be deleted by pressing the <kbd>`del`</kbd> or <kbd>`backspace`</kbd> key.  

### Group Controls
#### Vumeter
#### Solo Mode
#### Disabled Mode
#### Dimmer Knob

## Deleting Groups

## Master
The master container can be used to trigger rows of cues of same index. It is useful to put in place complex [scenes](/workflow/scenes/) and [effects](/workflow/effects/) live. It also comes with a master dimmer and a toggleable on/off output that affects each individual group within the [pool](#group-pool).
### Cue Triggers
### Master Dimmer Knob
### Disbale Mode