<template>
  <uk-widget :header="{ title: 'Universe', icon: 'wrench' }">
    <template v-if="universe && universe.fixturePool">
      <uk-flex :gap="8" col class="universe_settings">
        <uk-txt-input label="Name" v-model="universe.name" />
        <uk-select-input label="Color" :modelValue="getIndexFromColor(universe.color)" @input="setUniverseColor" :options="colorOptions" />
        <uk-num-input style="width: 60px" label="ID" v-model="universe.id" />
      </uk-flex>
    </template>
    <h3 v-else class="empty_text">No Universe Selected</h3>
  </uk-widget>
</template>

<script>
import colorMixin from "@/views/mixins/color.mixin";

export default {
  name: "universeModifierSettings",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [colorMixin],
  props: {
    modelValue: Object,
  },
  data() {
    return {
      header: {
        title: "Universe Settings",
        icon: "wrench",
      },
      universe: this.modelValue,
    };
  },
  methods: {
    setUniverseColor(colorIndex) {
      this.universe.color = this.getColorFromIndex(colorIndex);
    },
  },
  watch: {
    modelValue(value) {
      this.universe = value;
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
