<template>
  <div class="cuepool_stage">
    <group-modifier-widget-cuepool
      class="cuepool_stage_pool"
      :group="group"
    />
    <div class="cuepool_stage_view">
      <visualizer-preview />
    </div>
  </div>
</template>

<script>
import GroupModifierWidgetCuepool from '@/views/activities/app/fragments/modifiers/group/_widgets/group.modifier.widget.cuepool.vue';
import VisualizerPreview from './VisualizerPreview.vue';

/**
 * A group's cue pool next to the visualizer: play a cue, watch the rig answer. Both are Studio's
 * own components on the demo show; the cue pool keeps its size in Studio's modifier strip.
 * @displayName CuePoolStage
 */
export default {
  name: 'CuePoolStage',
  compatConfig: { MODE: 3 },
  components: { GroupModifierWidgetCuepool, VisualizerPreview },
  props: {
    /**
     * Group whose cues are shown
     */
    group: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
.cuepool_stage {
  display: flex;
  gap: 16px;
  height: 100%;
  align-items: flex-start;
}

.cuepool_stage_pool {
  height: 239px;
}

.cuepool_stage_view {
  width: 560px;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
}
</style>
