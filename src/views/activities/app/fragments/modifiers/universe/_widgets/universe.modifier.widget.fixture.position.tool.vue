<template>
  <uk-widget class="position_tool" dockable :header="{ title: 'Position Tool', icon: 'move' }">
    <uk-flex v-if="fixture" class="position_tool_body" :gap="16">
      <uk-flex col :gap="8">
        <uk-num-input color="#A22D58AF" :precision="1" :min="-1000" :max="1000" label="Position X" v-model="fixture.posX" />
        <uk-num-input color="#0E7A7DAF" :precision="1" :min="-1000" :max="1000" label="Position Y" v-model="fixture.posY" />
        <uk-num-input color="#2D6BA2AF" :precision="1" :min="-1000" :max="1000" label="Position Z" v-model="fixture.posZ" />
      </uk-flex>
      <uk-flex col :gap="8">
        <uk-num-input color="#A22D58AF" :min="-360" :max="360" label="Rotation X" v-model="fixture.rotX" />
        <uk-num-input color="#0E7A7DAF" :min="-360" :max="360" label="Rotation Y" v-model="fixture.rotY" />
        <uk-num-input color="#2D6BA2AF" :min="-360" :max="360" label="Rotation Z" v-model="fixture.rotZ" />
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
export default {
  name: "universeModifierWidgetPositionTool",
  props: {
    /**
     * Handle to fixture instance
     */
    fixture: Object,
  },
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: "Fixture Settings",
        icon: "move",
      },
    };
  },
};
</script>

<style scoped>
.position_tool {
  max-width: 170px;
  min-width: 170px;
}
.position_tool_body {
  height: 100%;
  width: 100%;
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
