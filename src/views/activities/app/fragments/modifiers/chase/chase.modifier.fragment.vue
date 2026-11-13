<template>
  <uk-flex
    v-if="chase"
    tabindex="0"
    class="chase_modifier"
  >
    <uk-widget :header="{ title: 'Chase' }">
      <uk-flex
        :gap="8"
        col
        class="chase_settings"
      >
        <uk-flex :gap="8">
          <uk-txt-input
            v-model="chase.name"
            label="Name"
          />
          <uk-num-input
            v-model="chase.duration"
            style="width: 70px"
            :min="1"
            :max="99"
            label="Duration"
          />
        </uk-flex>
        <uk-select-input
          label="Color"
          :model-value="getIndexFromColor(chase.color)"
          :options="colorOptions"
          @input="setChaseColor"
        />
        <uk-flex :gap="8">
          <uk-select-input
            v-model="chase.quantize"
            label="Quantize"
            :options="quantizeOptions"
          />
          <uk-select-input
            v-model="chase.trigger"
            class="field"
            label="Trigger"
            :options="triggerOptions"
          />
        </uk-flex>
      </uk-flex>
    </uk-widget>
    <widget-pool-timeline
      v-show="group.cuePool?.cues.length"
      :pool="chase"
    />
  </uk-flex>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import KeysMixin from '@/views/mixins/keys.mixin';
import WidgetPoolTimeline from './_widgets/chase.modifier.widget.timeline.vue';

export default {
  name: 'ChaseModifierFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  components: {
    WidgetPoolTimeline,
  },
  mixins: [colorMixin, KeysMixin],
  data() {
    return {
      triggerOptions: ['Loop', 'One Shot'],
      quantizeOptions: ['None', '1/8', '1/4', '1/2', '1/1'],
    };
  },
  computed: {
    /**
     * Group of the chase in view
     *
     * @type {?Object}
     */
    group() {
      return this.$view.group;
    },
    /**
     * Chase in view, or null
     *
     * @type {?Object}
     */
    chase() {
      return this.$view.chase;
    },
  },
  methods: {
    /**
     * Keys while the chase panel has focus: Delete or Backspace deletes the chase in view (the
     * view falls back to its group). Typing in its fields never gets here
     *
     * @public
     * @param {KeyboardEvent} e keydown event
     * @returns {Boolean} whether the key was handled
     */
    handleKeys(e) {
      if ((e.key === 'Backspace' || e.key === 'Delete') && this.chase) {
        this.group.chasePool.delete(this.chase);
        return true;
      }
      return false;
    },
    /**
     * Sets the chase's colour
     *
     * @public
     * @param {Number} colorIndex palette index
     */
    setChaseColor(colorIndex) {
      this.chase.color = this.getColorFromIndex(colorIndex);
    },
  },
};
</script>

<style scoped>
.chase_modifier {
  width: 100%;
  height: 100%;
}
.chase_settings {
  height: 100%;
  width: 200px;
  padding: 10px;
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}
.field_label {
  margin-bottom: 8px;
}
</style>
