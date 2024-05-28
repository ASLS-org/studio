<template>
  <uk-widget
    :default-docked="defaultDocked"
    :header="headerData"
    class="pantilt_widget"
    dockable
  >
    <div
      ref="grid"
      class="pan_tilt"
      @mousedown="startDrag($event)"
      @mouseup="stopDrag()"
    >
      <div
        ref="tick"
        :style="tickStyle"
        class="tick"
      />
      <div
        ref="fineTick"
        :style="fineTickStyle"
        class="tick"
      />
    </div>
    <uk-flex
      col
      class="textual"
      :gap="16"
    >
      <uk-flex :gap="16">
        <uk-num-input
          v-model="pan"
          :disabled="fine"
          label="Pan"
          :min="0"
          :max="255"
          :default="0"
          class="value_input"
          @input="update()"
        />
        <uk-num-input
          v-model="panFine"
          :disabled="!fine"
          label="Fine"
          :min="0"
          :max="255"
          :default="0"
          class="value_input"
          @input="update()"
        />
      </uk-flex>
      <uk-flex :gap="16">
        <uk-num-input
          v-model="tilt"
          :disabled="fine"
          label="Tilt"
          :min="0"
          :max="255"
          :default="0"
          class="value_input"
          @input="update()"
        />
        <uk-num-input
          v-model="tiltFine"
          :disabled="!fine"
          label="Fine"
          :min="0"
          :max="255"
          :default="0"
          class="value_input"
          @input="update()"
        />
      </uk-flex>
      <uk-flex style="margin-top: 8px">
        <uk-checkbox
          v-model="fine"
          label="Set fine channels"
        />
      </uk-flex>
    </uk-flex>
  </uk-widget>
</template>

<script>
/**
 * @component PanTilt
 * @namespace activities/app/fragments/modifiers/widgets
 * @story Default {"panTilt":{}}
 */
export default {
  name: 'UkWidgetPantilt',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    panTilt: {
      type: Object,
      default: () => ({
        pan: 0,
        tilt: 0,
        panFine: 0,
        tiltFine: 0,
      }),
    },
    defaultDocked: Boolean,
  },
  emits: ['input'],
  data() {
    return {
      headerData: {
        title: 'Pan/Tilt',
        icon: 'move',
      },
      pan: 0,
      tilt: 0,
      panFine: 0,
      tiltFine: 0,
      dragging: false,
      fine: false,
      grid: null,
    };
  },
  computed: {
    tickStyle() {
      const width = this.grid ? this.grid.clientWidth - 12 : 0;
      const height = this.grid ? this.grid.clientHeight - 12 : 0;
      return {
        left: `${Math.min((this.pan / 255) * width, width)}px`,
        top: `${Math.min((this.tilt / 255) * height, height)}px`,
        opacity: this.fine ? 0.4 : 1,
      };
    },
    fineTickStyle() {
      const width = this.grid ? this.grid.clientWidth - 12 : 0;
      const height = this.grid ? this.grid.clientHeight - 12 : 0;
      return {
        left: `${Math.min((this.panFine / 255) * width, width)}px`,
        top: `${Math.min((this.tiltFine / 255) * height, height)}px`,
        opacity: !this.fine ? 0.4 : 1,
      };
    },
  },
  watch: {
    panTilt: {
      handler(value) {
        this.pan = value.pan;
        this.panFine = value.panFine;
        this.tilt = value.tilt;
        this.tiltFine = value.tiltFine;
      },
    },
  },
  mounted() {
    this.grid = this.$refs.grid;

    this.pan = this.panTilt.pan;
    this.panFine = this.panTilt.panFine;
    this.tilt = this.panTilt.tilt;
    this.tiltFine = this.panTilt.tiltFine;
  },
  methods: {
    update() {
      this.$emit('input', {
        pan: this.pan,
        panFine: this.panFine,
        tilt: this.tilt,
        tiltFine: this.tiltFine,
      });
    },
    startDrag(e) {
      this.$utils.setCapture(e.currentTarget, 'move');
      this.dragging = true;
      const self = this;
      window.addEventListener('mousemove', self.drag);
      window.addEventListener('mouseup', self.stopDrag);
      this.drag(e);
    },
    drag(e) {
      if (this.dragging === true) {
        const { tick } = this.$refs;
        const { grid } = this.$refs;
        const gridRect = grid.getBoundingClientRect();

        const limX = grid.clientWidth - tick.clientWidth * 2;
        const limY = grid.clientHeight - tick.clientHeight * 2;

        const posX = Math.min(Math.max(e.clientX - gridRect.left - tick.clientWidth, 0), limX);
        const posY = Math.min(Math.max(e.clientY - gridRect.top - tick.clientHeight, 0), limY);

        const panVal = (posX / limX) * 254.5;
        const tiltVal = (posY / limY) * 255;

        if (this.fine) {
          this.panFine = Math.ceil(panVal);
          this.tiltFine = Math.ceil(tiltVal);
        } else {
          this.pan = Math.ceil(panVal);
          this.tilt = Math.ceil(tiltVal);
        }

        this.update();
      }
    },
    stopDrag() {
      window.removeEventListener('mousemove', null);
      window.removeEventListener('mouseup', null);
      this.dragging = false;
    },
  },
};
</script>

<style scoped>
.pantilt_widget {
  min-width: 350px;
  width: fit-content;
}
.textual {
  padding: 10px;
  height: 100%;
}
.pan_tilt {
  overflow: hidden;
  position: relative;
  top: -1px;
  left: -1px;
  aspect-ratio: 1 / 1;
  height: 100%;
  background-color: var(--primary-dark-alt);
  background-image:
    linear-gradient(
      to right,
      var(--primary-dark) 0,
      var(--primary-dark) 1px,
      transparent 1px,
      transparent 100%
    ),
    linear-gradient(
      to bottom,
      var(--primary-dark) 0,
      var(--primary-dark) 1px,
      transparent 1px,
      transparent 100%
    );
  background-size: 18px 18px;
  cursor: pointer;
}
.pan_tilt:before,
.pan_tilt:after {
  position: absolute;
  content: "";
  height: 100%;
  width: 0px;
  border-top: 1px solid var(--secondary-light);
  border-right: 1px solid var(--secondary-light);
  left: 50%;
}
.pan_tilt:after {
  top: 50%;
  height: 0px;
  width: 100%;
  left: 0px;
}
.tick {
  position: absolute;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  border: 2px solid var(--secondary-light);
  /* background: #1e45b9; */
  background: var(--accent-blue)!important;
  z-index: 200;
  top: calc(50% - 6px);
  left: calc(50% - 6px);
  cursor: pointer;
  pointer-events: none;
  opacity: .8
}
.tick:nth-child(2){
  background: var(--accent-pink)!important;
}
.value_input {
  width: 60px;
}
.hidden {
  display: none;
}
</style>
