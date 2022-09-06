<template>
  <div class="group_modifier" v-show="group">
    <group-settings-widget v-if="group" v-model="group" />
    <fixture-pool-widget
      v-show="group"
      @delete="deleteFixtures"
      :pool="group ? group.fixturePool : {}"
      :action="{ icon: 'new', text: 'add', callback: displayFixturePopup }"
    />
    <widget-cuepool v-show="group" @select="selectCue" :group="group" />
    <cue-settings-widget v-show="cue" v-model="cue" />
    <scene-modifier :scene="cue" v-show="cue && cue.type === 0" />
    <effect-modifier v-model="cue" v-if="cue && cue.type === 1" />
    <popup-group-patch v-show="group" :group="group" v-model="fixturePopupDisplayState" />
  </div>
</template>

<script>
import colorMixin from "@/views/mixins/color.mixin";
import FixturePoolWidget from "../_widgets/modifier.widget.fixture.pool.vue";

import SceneModifier from "./group.scene.modifier.fragment.vue";
import EffectModifier from "./group.effect.modifier.fragment.vue";

import PopupGroupPatch from "./_popups/group.modifier.popup.patch.vue";
import GroupSettingsWidget from "./_widgets/group.modifier.widget.settings.vue";
import CueSettingsWidget from "./_widgets/group.modifier.widget.cue.settings.vue";
import WidgetCuepool from "./_widgets/group.modifier.widget.cuepool.vue";

export default {
  name: "groupModifierFragment",
  components: {
    PopupGroupPatch,
    GroupSettingsWidget,
    FixturePoolWidget,
    CueSettingsWidget,
    WidgetCuepool,
    SceneModifier,
    EffectModifier,
  },
  mixins: [colorMixin],
  data() {
    return {
      /**
       * Handle to the group instance to be displayed
       */
      group: this.$show.groupPool.getFromId(this.$route.params.groupId),
      /**
       * Handle to currently selected fixture instance
       */
      fixture: null,
      /**
       * Handle to currently selected cue instance
       */
      cue: null,
      /**
       * Group fixture patching popup display state
       */
      fixturePopupDisplayState: false,
    };
  },
  methods: {
    /**
     * Fetches group data from route's groupId param
     * 
       * @public
     */
    fetchGroupData() {
      try {
        this.group = this.$show.groupPool.getFromId(this.$route.params.groupId);
        this.fixture = null;
        this.fixturePopupDisplayState = false;
        if (this.group.cuePool.cues.length) {
          this.selectCue(this.group.cuePool.cues[0], false);
        } else {
          this.cue = null;
        }
      } catch (err) {
        this.group = null;
        this.fixture = null;
        this.cue = null;
      }
    },
    /**
     * Deletes one or multiple fixtures from the group's fixture list
     * 
       * @public
     * @param {Array} fixtures array of group fixture objects
     */
    deleteFixtures(fixtures) {
      fixtures.forEach((fixture) => {
        this.group.deleteFixture(fixture);
      });
    },
    /**
     * Selects a cue to be displayed within the group's cue sub-fragment
     * 
       * @public
     * @param {Object} cuehandle to the group's cue instance to be displayed
     */
    selectCue(cue) {
      if (cue) {
        this.cue = cue;
        if (this.$route.name === "Group") {
          history.pushState({}, null, `${this.$route.path}/cue/${encodeURIComponent(cue.id)}`);
        }
      } else {
        this.cue = null;
      }
    },
    /**
     * Prepares the list of available fixtures and displays group fixture patching popup. 
     * 
       * @public
     */
    displayFixturePopup() {
      this.availableFixtures = this.$show.fixturePool.fixtures.filter((fixture) => {
        try {
          this.group.fixturePool.getFromId(fixture.id);
          return false;
        } catch (err) {
          return true;
        }
      });
      this.fixturePopupDisplayState = true;
    },
  },
  mounted() {
    this.fetchGroupData();
  },
  watch: {
    "$route.params.groupId"() {
      this.fetchGroupData();
    },
  },
};
</script>

<style scoped>
.group_modifier {
  display: flex;
  min-width: 100%;
  overflow: auto;
  height: 100%;
  flex-direction: row;
}
.group_fixtures {
  min-width: 250px !important;
}
.modifier_widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: fit-content !important;
}
.modifier_widget_body {
  display: flex;
  height: 100%;
  align-items: center;
  overflow: hidden;
  overflow-x: auto;
}
.modifier {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  border-right: 1px solid var(--primary-dark);
}
.modifier_input {
  width: 100px;
  margin-bottom: 8px;
}
</style>
