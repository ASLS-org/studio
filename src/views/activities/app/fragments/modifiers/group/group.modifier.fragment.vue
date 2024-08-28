<template>
  <div
    v-show="group"
    class="group_modifier"
  >
    <group-settings-widget :group="group" />
    <fixture-pool-widget
      v-show="group"
      :pool="group ? group.fixturePool : {}"
      :action="{ icon: 'new', text: 'add', callback: displayFixturePopup }"
      @delete="deleteFixtures"
    />
    <widget-cuepool
      v-show="group"
      :group="group"
      @select="selectCue"
    />
    <cue-settings-widget
      v-show="cue"
      :cue="cue"
    />
    <keep-alive>
      <scene-modifier
        v-show="cue && cue.type === 0"
        :scene="cue"
      />
    </keep-alive>
    <keep-alive>
      <effect-modifier
        v-show="cue && cue.type === 1"
        :effect="cue"
      />
    </keep-alive>
    <popup-group-patch
      v-show="group"
      v-model="fixturePopupDisplayState"
      :group="group"
    />
  </div>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import Group from '@/models/DMX/group.model';
import Cue from '@/models/DMX/cue.model';
import Fixture from '@/models/DMX/fixture.model';
import FixturePoolWidget from '../_widgets/modifier.widget.fixture.pool.vue';

import SceneModifier from './group.scene.modifier.fragment.vue';
import EffectModifier from './group.effect.modifier.fragment.vue';

import PopupGroupPatch from './_popups/group.modifier.popup.patch.vue';
import GroupSettingsWidget from './_widgets/group.modifier.widget.settings.vue';
import CueSettingsWidget from './_widgets/group.modifier.widget.cue.settings.vue';
import WidgetCuepool from './_widgets/group.modifier.widget.cuepool.vue';

export default {
  name: 'GroupModifierFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
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
      group: new Group(), // this.$show.groupPool.getFromId(this.$route.params.groupId),
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
  watch: {
    // TODO: feed method straight into watcher (idealy get read of watchers as much as possible)
    '$route.params.groupId': function routeParamsGroupIdWatcher(id) {
      if (id !== undefined) {
        this.fetchGroupData(id);
      }
    },
  },
  methods: {
    /**
     * Fetches group data from route's groupId param
     *
       * @public
     */
    fetchGroupData(id) {
      if (id !== undefined) {
        try {
          this.group = this.$show.groupPool.getFromId(id);
          this.fixture = null;
          this.fixturePopupDisplayState = false;
          if (this.group.cuePool.cues.length) {
            this.selectCue(this.group.cuePool.cues[0], false);
          } else {
            this.cue = null;
          }
        } catch (err) {
          this.group = new Group();
          this.fixture = new Fixture({ isStub: true });
          this.cue = new Cue({ isStub: true });
        }
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
        if (this.$route.name === 'Group') {
          // eslint-disable-next-line no-restricted-globals
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
