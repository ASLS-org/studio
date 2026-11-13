<template>
  <div
    v-if="group"
    class="group_modifier"
  >
    <group-settings-widget :group="group" />
    <fixture-pool-widget
      :pool="group.fixturePool"
      :action="{ icon: 'new', text: 'add', callback: displayFixturePopup }"
      :selection="selectedIds"
      @selection="selectFixtures"
      @delete="deleteFixtures"
    />
    <widget-cuepool :group="group" />
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
      v-model="fixturePopupDisplayState"
      :group="group"
    />
  </div>
</template>

<script>
import modal from '@/views/mixins/modal.mixin';
import colorMixin from '@/views/mixins/color.mixin';
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
  computed: {
    /**
     * Group fixture patching popup display state
     */
    fixturePopupDisplayState: modal('group.patch', 'group'),
    /**
     * Group in view (the last one, while another panel is in view)
     *
     * @type {?Object}
     */
    group() {
      return this.$view.group;
    },
    /**
     * Group's selected cue
     *
     * @type {?Object}
     */
    cue() {
      return this.$view.cue;
    },
    /**
     * Selected fixture ids of the group, shared by its fixture pool and the scene's list. They
     * stay as they are while another panel is in view
     *
     * @type {Array<Number>}
     */
    selectedIds() {
      return this.$view.groupFixtures.map((fixture) => fixture.id);
    },
  },
  methods: {
    /**
     * Selects fixtures of the group (a new main fixture shows all its cells again)
     *
     * @public
     * @param {Array<Number>} ids fixture ids, main one first
     */
    selectFixtures(ids) {
      const main = this.$view.fixture?.id;
      this.$view.selectFixtures(ids);
      if (this.$view.fixture?.id !== main) this.$view.selectCells(null);
    },
    /**
     * Removes one or more fixtures from the group (not from the show)
     *
     * @public
     * @param {Array} fixtures listable data of the group's fixtures
     */
    deleteFixtures(fixtures) {
      fixtures.forEach((fixture) => {
        this.group.deleteFixture(fixture);
      });
    },
    /**
     * Displays the group fixture patching popup
     *
     * @public
     */
    displayFixturePopup() {
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
