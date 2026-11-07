# Groups

A group is a set of fixtures you program together: it owns the [scenes](/programming/scenes) and
[effects](/programming/effects) you make for them, and the [chases](/programming/chases) that
sequence those cues. A group can mix fixtures from different universes, and a fixture can belong
to several groups.

Groups are listed side by side in the **Group Pool**, in the middle of the screen. Click a group to
open its **group view** at the bottom of the screen.

<LivePreview preset="group-pool" />

A new show comes with four empty groups.

## Creating a Group

1. Press **New** in the group pool's header. The **Create Group** popup opens.
2. Tick the fixtures to include, or **Check All** for a whole universe.
3. Set the group's **Name** and **Color**, and press **OK**.

You can create an empty group and add fixtures later.

<LivePreview preset="group-pool-new" />

## The Group View

The group view holds the group's settings, its fixtures and its cues. Selecting a cue adds that
cue's widgets on the right: see [Scenes](/programming/scenes) and [Effects](/programming/effects).

<LivePreview preset="group-modifier" />

### Group Settings

<LivePreview preset="group-settings" />

| Setting | Description |
| --- | --- |
| **Name** | The group's name |
| **Color** | The group's colour in the group pool and on its cues |

### Fixture Pool

Lists the group's fixtures. Click one to select it, hold <kbd>Ctrl</kbd> to select several, and
type in **Search items** to filter the list.

<LivePreview preset="group-fixture-pool" />

To add fixtures, press **Add** and tick them in the popup.

<LivePreview preset="group-patch-add" />

To remove fixtures from the group, select them, press <kbd>Delete</kbd> or <kbd>Backspace</kbd>
and confirm. They stay patched: they only leave this group and its cues.

<LivePreview preset="group-fixture-pool-delete" />

## Deleting a Group

Click the group in the group pool, press <kbd>Delete</kbd> or <kbd>Backspace</kbd> and confirm. Its
cues and chases are deleted with it; its fixtures stay patched.
