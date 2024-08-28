<template>
  <uk-widget
    class="position_tool"
    dockable
    :header="{ title: 'Position Tool', icon: 'move' }"
  >
    <uk-flex
      v-if="fixture"
      class="position_tool_body"
      :gap="16"
    >
      <uk-flex
        col
        :gap="8"
      >
        <uk-num-input
          v-model="fixture.posX"
          color="var(--accent-maroon)"
          :precision="1"
          :min="-1000"
          :max="1000"
          label="Position X"
        />
        <uk-num-input
          v-model="fixture.posY"
          color="var(--accent-teal)"
          :precision="1"
          :min="-1000"
          :max="1000"
          label="Position Y"
        />
        <uk-num-input
          v-model="fixture.posZ"
          color="var(--accent-blue)"
          :precision="1"
          :min="-1000"
          :max="1000"
          label="Position Z"
        />
      </uk-flex>
      <uk-flex
        col
        :gap="8"
      >
        <uk-num-input
          v-model="fixture.rotX"
          color="var(--accent-maroon)"
          :min="-360"
          :max="360"
          label="Rotation X"
        />
        <uk-num-input
          v-model="fixture.rotY"
          color="var(--accent-teal)"
          :min="-360"
          :max="360"
          label="Rotation Y"
        />
        <uk-num-input
          v-model="fixture.rotZ"
          color="var(--accent-blue)"
          :min="-360"
          :max="360"
          label="Rotation Z"
        />
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
export default {
  name: 'UniverseModifierWidgetPositionTool',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Handle to fixture instance
     */
    fixture: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      /**
       * Widget header data
       */
      header: {
        title: 'Fixture Settings',
        icon: 'move',
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
