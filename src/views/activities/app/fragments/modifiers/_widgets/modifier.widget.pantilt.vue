<template>
  <uk-widget :defaultDocked="defaultDocked" :header="headerData" class="pantilt_widget" dockable>
    <div ref="grid" @mousedown="startDrag($event)" @mouseup="stopDrag()" class="pan_tilt">
      <div v-show="!fine" :style="tickStyle" class="tick" ref="tick" />
      <div v-show="fine" :style="fineTickStyle" class="tick" ref="fineTick" />
    </div>
    <uk-flex col class="textual" :gap="16">
      <uk-flex :gap="16">
        <uk-num-input :disabled="fine" @input="update()" label="Pan" :min="0" :max="255" :default="0" class="value_input" v-model="pan" />
        <uk-num-input :disabled="!fine" @input="update()" label="Fine" :min="0" :max="255" :default="0" class="value_input" v-model="panFine" />
      </uk-flex>
      <uk-flex :gap="16">
        <uk-num-input :disabled="fine"  @input="update()" label="Tilt" :min="0" :max="255" :default="0" class="value_input" v-model="tilt" />
        <uk-num-input :disabled="!fine"  @input="update()" label="Fine" :min="0" :max="255" :default="0" class="value_input" v-model="tiltFine" />
      </uk-flex>
      <uk-flex style="margin-top: 8px">
        <uk-checkbox v-model="fine" label="Set fine channels" />
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
  name: "ukWidgetPantilt",
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
  data() {
    return {
      headerData: {
        title: "Pan/Tilt",
        icon: "move",
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
      let width = this.grid ? this.grid.clientWidth - 12 : 0;
      let height = this.grid ? this.grid.clientHeight - 12 : 0;
      return {
        left: Math.min((this.pan / 255) * width, width) + "px",
        top: Math.min((this.tilt / 255) * height, height) + "px",
        opacity: this.fine ? .4 : 1
      };
    },
    fineTickStyle() {
      let width = this.grid ? this.grid.clientWidth - 12 : 0;
      let height = this.grid ? this.grid.clientHeight - 12 : 0;
      return {
        left: Math.min((this.panFine / 255) * width, width) + "px",
        top: Math.min((this.tiltFine / 255) * height, height) + "px",
        opacity: !this.fine ? .4 : 1
      };
    },
  },
  methods: {
    update() {
      this.$emit("input", {
        pan: this.pan,
        panFine: this.panFine,
        tilt: this.tilt,
        tiltFine: this.tiltFine,
      });
    },
    startDrag(e) {
      this.dragging = true;
      var self = this;
      window.addEventListener("mousemove", self.drag);
      window.addEventListener("mouseup", self.stopDrag);
      this.drag(e);
    },
    drag(e) {
      if (this.dragging == true) {
        var tick = this.$refs.tick;
        var grid = this.$refs.grid;
        var gridRect = grid.getBoundingClientRect();

        var limX = grid.clientWidth - tick.clientWidth * 2;
        var limY = grid.clientHeight - tick.clientHeight * 2;

        var posX = Math.min(Math.max(e.clientX - gridRect.left - tick.clientWidth, 0), limX);
        var posY = Math.min(Math.max(e.clientY - gridRect.top - tick.clientHeight, 0), limY);

        let panVal = (posX / limX) * 254.5;
        let tiltVal = (posY / limY) * 255;

        if (this.fine) {
          this.panFine =  Math.ceil(panVal);
          this.tiltFine = Math.ceil(tiltVal);
        } else {
          this.pan = Math.ceil(panVal);
          this.tilt = Math.ceil(tiltVal);
        }

        this.update();
      }
    },
    stopDrag() {
      window.removeEventListener("mousemove", null);
      window.removeEventListener("mouseup", null);
      this.dragging = false;
    },
  },
  mounted() {
    this.grid = this.$refs.grid;

    this.pan = this.panTilt.pan;
    this.panFine = this.panTilt.panFine;
    this.tilt = this.panTilt.tilt;
    this.tiltFine = this.panTilt.tiltFine;
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
  min-width: 190px;
  max-width: 190px;
  height: 100%;
  background-color: var(--primary-dark-alt);
  background-image: linear-gradient(to right, var(--primary-dark) 0, var(--primary-dark) 1px, transparent 1px, transparent 100%),
    linear-gradient(to bottom, var(--primary-dark) 0, var(--primary-dark) 1px, transparent 1px, transparent 100%);
  background-size: 18.9px 18.2px;
  cursor: pointer;
}
.pan_tilt:before,
.pan_tilt:after {
  position: absolute;
  content: "";
  height: 100%;
  width: 1px;
  background: var(--secondary-light);
  left: 50%;
}
.pan_tilt:after {
  top: 50%;
  height: 1px;
  width: 100%;
  left: 0px;
}
.tick {
  position: absolute;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  border: 1px solid var(--secondary-light);
  background: #1e45b9;
  z-index: 200;
  top: calc(50% - 6px);
  left: calc(50% - 6px);
  cursor: pointer;
  pointer-events: none;
  opacity: .8
}
.tick:nth-child(2){
  background: #bb2d98!important;
}
.value_input {
  width: 60px;
}
.hidden {
  display: none;
}
</style>
