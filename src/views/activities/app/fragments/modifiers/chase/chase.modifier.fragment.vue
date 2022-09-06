<template>
  <uk-flex class="chase_modifier">
    <uk-widget :header="{ title: 'Chase' }">
      <uk-flex :gap="8" col class="chase_settings">
        <uk-flex :gap="8">
          <uk-txt-input label="Name" v-model="chase.name" />
          <uk-num-input style="width: 70px" :min="1" :max="99" label="Duration" v-model="chase.duration" />
        </uk-flex>
        <uk-select-input label="Color" :value="0" :options="colorOptions" />
        <uk-flex :gap="8">
          <uk-select-input label="Quantize" v-model="chase.quantize" :options="quantizeOptions" />
          <uk-select-input class="field" label="Trigger" v-model="chase.trigger" :options="triggerOptions" />
        </uk-flex>
      </uk-flex>
    </uk-widget>
    <widget-pool-timeline v-show="group.cuePool.cues.length" :pool="chase" />
  </uk-flex>
</template>

<script>
import WidgetPoolTimeline from "./_widgets/chase.modifier.widget.timeline.vue";
import colorMixin from "@/views/mixins/color.mixin";

export default {
  name: "chaseModifierFragment",
  components: {
    WidgetPoolTimeline,
  },
  mixins: [colorMixin],
  data() {
    return {
      /**
       * Handle to the selected group instance
       */
      group: this.$show.groupPool.getFromId(this.$route.params.groupId),
      /**
       * Handle to the group's selected chase instance
       */
      chase: this.$show.groupPool.getFromId(this.$route.params.groupId).chasePool.getFromId(this.$route.params.chaseId),
      /**
       * Chase trigger options
       * @todo this should be static/hardcoded
       */
      triggerOptions: ["Toggle", "One Shot"],
      /**
       * Chase triquantization options
       * @todo this should be static/hardcoded
       */
      quantizeOptions: ["None", "1/8", "1/4", "1/2", "1/1"],
    };
  },
  methods: {
    /**
     * Fetch group and chase data from route groupId and chaseId parameters
     * 
       * @public
     */
    fetchChaseData() {
      window.removeEventListener("keydown", this.keydownHandler);
      if (this.$route.params.chaseId != null && this.$route.params.groupId != null) {
        this.group = this.$show.groupPool.getFromId(this.$route.params.groupId);
        this.chase = this.$show.groupPool.getFromId(this.$route.params.groupId).chasePool.getFromId(this.$route.params.chaseId);
        window.addEventListener("keydown", this.keydownHandler);
      }
    },
    /**
     * Keydown handler used to handle chase deletion on del/backspace hit
     * 
       * @public
     * @param {Object} e keydown event 
     */
    keydownHandler(e) {
      if (e.key === "Backspace" || e.key === "Delete") {
        this.group.chasePool.delete(this.chase);
        this.$router.push(`/group/${this.$route.params.groupId}`).catch(() => {});
      }
    },
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.keydownHandler);
  },
  mounted() {
    this.fetchChaseData();
  },
  watch: {
    "$route.params.chaseId"() {
      this.fetchChaseData();
    },
    "$route.params.groupId"() {
      this.fetchChaseData();
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
