<template>
  <uk-flex class="chase_modifier">
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
      v-show="group.cuePool.cues.length"
      :pool="chase"
    />
  </uk-flex>
</template>

<script>
import colorMixin from '@/views/mixins/color.mixin';
import Group from '@/models/DMX/group.model';
import Chase from '@/models/DMX/chase.model';
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
  mixins: [colorMixin],
  data() {
    return {
      /**
       * Handle to the selected group instance
       */
      group: new Group(), // this.$show.groupPool.getFromId(this.$route.params.groupId),
      /**
       * Handle to the group's selected chase instance
       */
      // eslint-disable-next-line max-len
      chase: new Chase(), // this.$show.groupPool.getFromId(this.$route.params.groupId).chasePool.getFromId(this.$route.params.chaseId),
      /**
       * Chase trigger options
       * @todo this should be static/hardcoded
       */
      triggerOptions: ['Loop', 'One Shot'],
      /**
       * Chase triquantization options
       * @todo this should be static/hardcoded
       */
      quantizeOptions: ['None', '1/8', '1/4', '1/2', '1/1'],
    };
  },
  watch: {
    // '$route.params.chaseId': function routeParamsChaseIdWatcher(chaseId) {
    //   console.log('dklsdklskd');
    //   this.fetchChaseData(chaseId);
    // },
    '$route.params': function routeParamsChaseIdWatcher({ groupId, chaseId }) {
      if (groupId) this.fetchGroupData(groupId);
      if (chaseId) this.fetchChaseData(chaseId);
    },
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.keydownHandler);
  },
  methods: {
    /**
     * Fetch group and chase data from route groupId and chaseId parameters
     *
       * @public
     */
    fetchChaseData(id) {
      if (id !== undefined) {
        window.removeEventListener('keydown', this.keydownHandler);
        // eslint-disable-next-line max-len
        this.chase = this.group.chasePool.getFromId(id);
        window.addEventListener('keydown', this.keydownHandler);
      }
    },
    fetchGroupData(id) {
      if (id !== undefined) {
        window.removeEventListener('keydown', this.keydownHandler);
        this.group = this.$show.groupPool.getFromId(id);
      }
    },
    /**
     * Keydown handler used to handle chase deletion on del/backspace hit
     *
     * @public
     * @param {Object} e keydown event
     */
    keydownHandler(e) {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        this.group.chasePool.delete(this.chase);
        this.$router.push(`/group/${this.$route.params.groupId}`).catch(() => {});
      }
    },
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
