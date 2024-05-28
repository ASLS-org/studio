<template>
  <uk-widget :header="{ title: 'Universe', icon: 'wrench' }">
    <template v-if="universe && universe.fixturePool">
      <uk-flex
        :gap="8"
        col
        class="universe_settings"
      >
        <uk-txt-input
          v-model="universe.name"
          label="Name"
        />
        <uk-select-input
          label="Color"
          :model-value="getIndexFromColor(universe.color)"
          :options="colorOptions"
          @input="setUniverseColor"
        />
        <uk-num-input
          v-model="universe.id"
          style="width: 60px"
          label="ID"
        />
      </uk-flex>
    </template>
    <h3
      v-else
      class="empty_text"
    >
      No Universe Selected
    </h3>
  </uk-widget>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';

export default {
  name: 'UniverseModifierSettings',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
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
    };
  },
  watch: {
    modelValue(value) {
      this.universe = value;
    },

  },
  methods: {
    setUniverseColor(colorIndex) {
      this.universe.color = this.getColorFromIndex(colorIndex);
    },
  },
};
</script>

<style scoped>

.universe_settings {
  height: 100%;
  padding: 10px;
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
