<template>
  <uk-widget
    class="universe_settings_wrapper"
    :header="{ title: 'Universe', icon: 'wrench' }"
  >
    <template v-if="universe && universe.fixturePool">
      <uk-flex
        :gap="8"
        col
        class="universe_settings"
      >
        <uk-flex
          :gap="8"
        >
          <uk-txt-input
            v-model="universe.name"
            label="Name"
            style="width: 100%"
          />
          <uk-num-input
            :key="idFieldKey"
            :model-value="universe.id"
            style="width: 60px"
            label="ID"
            @update:model-value="setUniverseId"
          />
        </uk-flex>
        <uk-flex
          gap="10"
          center-both
          style="width:100%;"
        >
          <uk-select-input
            :model-value="universe?.stream?.client?.name ?? null"
            label="Output"
            :placeholder="
              $show.outputPool.outputs.length
                ? 'No output selected'
                : 'No available outputs'
            "
            :options="outputOptions"
            :disabled="!$show.outputPool.outputs.length"
            @input="setOutput"
          />
          <uk-button
            square
            label="config"
            style="height:25px; min-width: 75px; margin-top:22px"
            @click="connectionsPopupState = true"
          />
        </uk-flex>
        <uk-select-input
          label="Color"
          color="var(--accent-blue)"
          :model-value="getIndexFromColor(universe.color)"
          :options="colorOptions"
          @input="setUniverseColor"
        />
      </uk-flex>
    </template>
    <h3
      v-else
      class="empty_text"
    >
      No Universe Selected
    </h3>
    <connections-popup v-model="connectionsPopupState" />
  </uk-widget>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import ConnectionsPopup from '@/views/activities/app/fragments/toolbar/_popups/popup.connections.vue';

export default {
  name: 'UniverseModifierSettings',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    ConnectionsPopup,
  },
  mixins: [colorMixin],
  props: {
    modelValue: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      header: {
        title: 'Universe Settings',
        icon: 'wrench',
      },
      universe: this.modelValue,
      output: null,
      /**
       * Connections popup display state (opened by Config)
       */
      connectionsPopupState: false,
      /**
       * Re-mounts the ID field, so a refused id shows the current one again
       */
      idFieldKey: 0,
    };
  },
  computed: {
    /**
     * Returns an array of HTML-formated strings s to be fed into uikit select inputs
     *
     * @returns {Array<String>} An array of HTML-formated strings
     */
    outputOptions() {
      return this.$show.outputPool.outputs.map((o) => o.name);
    },
  },
  watch: {
    modelValue(value) {
      this.universe = value;
    },
  },
  methods: {
    /**
     * Changes the universe's id (its fixtures follow), unless another universe uses it. The
     * universe view's route follows the new id.
     *
     * @public
     * @param {Number} id new id
     */
    setUniverseId(id) {
      const previous = this.universe.id;
      if (Number(id) === previous) return;
      if (!this.$show.universePool.changeId(this.universe, id)) {
        this.idFieldKey += 1;
        return;
      }
      const route = this.$route;
      if (route?.params?.universeId !== undefined && Number(route.params.universeId) === previous) {
        this.$router.replace({ path: `/universe/${this.universe.id}`, query: route.query })
          .catch(() => {});
      }
      this.$show.refreshSaveState();
    },
    setUniverseColor(colorIndex) {
      this.universe.color = this.getColorFromIndex(colorIndex);
    },
    setOutput(outputIndex) {
      const output = this.$show.outputPool.outputs[outputIndex];
      this.universe.setupConnection(output);
    },
  },
};
</script>

<style scoped>
.universe_settings_wrapper{
  min-width: 250px;
}
.universe_settings {
  height: 100%;
  padding: 10px;
  min-width: 250px;
}
.empty_text {
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  color: var(--secondary-light);
  justify-content: center;
}
</style>
