<template>
  <visualizer />
</template>

<script>
import Visualizer from '@/views/activities/app/fragments/visualizer/visualizer.fragment.vue';
import EventBus from '@/plugins/eventbus';

export default {
  name: 'VisualizerActivity',
  components: {
    Visualizer,
  },
  async mounted() {
    this.$show.slave = true;
    EventBus.on('visualizer_loaded', async () => {
      await this.$show.loadFromLocalStorage();
    });
  },
};
</script>
