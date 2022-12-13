<template>
  <Transition name="bounce">
    <uk-flex col class="popup" v-if="displayed">
      <uk-flex v-if="!noHeader" @mousedown.native="startDrag" @mouseup="stopDrag" class="header">
        <img v-if="header.icon" :src="header.icon" />
        <h3>{{ header.title }}</h3>
        <span style="flex: 1" />
        <uk-icon @click.native="close()" class="popup_close_icon" name="close" />
      </uk-flex>
      <uk-flex class="body">
        <slot />
      </uk-flex>
      <uk-flex v-if="!noValidation" class="popup_validation" :gap="8">
        <uk-spacer />
        <uk-button v-if="cancelable" @click.native="cancel()" :label="cancelTxt" />
        <uk-button :disabled="!valid" @click.native="submit()" :label="validateTxt" />
      </uk-flex>
    </uk-flex>
  </Transition>
</template>

<style scoped>
.bounce-enter-active {
  animation: bounce-in 0.2s;
  transform-origin: top;
}
.bounce-leave-active {
  animation: bounce-in 0.1s reverse;
}
@keyframes bounce-in {
  0% {
    scale: 1;
  }
  50% {
    scale: 1.05;
  }
  100% {
    scale: 1;
  }
}
</style>

<script>
/**
 * @namespace uikit/popup
 * @component Popup A slotted popup component that will automatically be appended to app's body.
 * @story Default {"header":{"title":"Default"},"value":true}
 */
export default {
  name: "ukPopup",
  props: {
    /**
     * Header definition object:
     * {Title: "String"}
     */
    header: Object,
    /**
     * Popup's display state
     */
    value: Boolean,
    /**
     * Whether to disable the popup header or not
     */
    noHeader: {
      type: Boolean,
      default: false,
    },
    /**
     * Whether the popup needs to be validated or not
     */
    noValidation: {
      type: Boolean,
      default: false,
    },
    /**
     * Whether the popup is movable or not
     */
    movable: {
      type: Boolean,
      default: true,
    },
    /**
     * Whether the popup is cancelable or not
     */
    cancelable: {
      type: Boolean,
      default: true,
    },
    /**
     * Whether the popup has a semi-transparent backdrop or not
     */
    backdrop: {
      type: Boolean,
      default: false,
    },
    /**
     * Whether the popup is valid and can be validated or not
     */
    valid: {
      type: Boolean,
      default: true,
    },
    /**
     * Custom close event function
     */
    onCancel: Function,
    /**
     * Custom validation button text
     */
    validateTxt: {
      type: String,
      default: "ok",
    },
    /**
     * Custom cancellation button text
     */
    cancelTxt: {
      type: String,
      default: "cancel",
    },
  },
  data() {
    return {
      /**
       * The popup's display state (Reactive)
       */
      displayed: this.value,
    };
  },
  methods: {
    /**
     * Update popup based on provided properties
     *
     */
    update() {
      let body = document.body;
      this.displayed = this.value;
      if (this.displayed) {
        window.addEventListener("keydown", this.handleKeydown.bind(this));
      }
      if (this.displayed && this.backdrop) {
        this.backdropEl = document.createElement("div");
        this.backdropEl.className = "backdrop";
        body.appendChild(this.backdropEl);
      } else if (this.backdrop && this.backdropEl) {
        body.removeChild(this.backdropEl);
      }
    },
    /**
     * Close the popup
     *
     */
    close() {
      this.displayed = false;
      /**
       * Input value changed
       *
       * @property {Boolean} displayed popup's current disaplay state
       */
      this.$emit("input", this.displayed);
      window.removeEventListener("keydown", this.handleKeydown);
    },
    cancel() {
      if (!this.onCancel) {
        this.displayed = false;
        /**
         * Input value changed
         *
         * @property {Boolean} displayed popup's current disaplay state
         */
        this.$emit("input", this.displayed);
        window.removeEventListener("keydown", this.handleKeydown);
      } else {
        this.onCancel();
      }
    },
    /**
     * On popup validation
     *
     */
    submit() {
      if (this.valid) {
        /**
         * Input submitted
         */
        this.$emit("submit");
      }
    },
    /**
     * Prepare popup dragging procedure
     *
     */
    startDrag() {
      if (this.movable) {
        window.addEventListener("mousemove", this.drag);
        window.addEventListener("mouseup", this.stopDrag);
        this.posX = this.$el.getBoundingClientRect().left;
      }
    },
    /**
     * Drag popup element
     *
     * @param {Object} e mousemove event
     */
    drag(e) {
      let box = this.$el.getBoundingClientRect();
      this.$el.style.left = Math.min(Math.max(e.clientX, box.width / 2), window.innerWidth - box.width / 2) + "px";
      this.$el.style.top = Math.min(Math.max(e.clientY + box.height / 2 - 15, box.height / 2), window.innerHeight - box.height / 2) + "px";
    },
    /**
     * End popup dragging procedure
     *
     */
    stopDrag() {
      window.removeEventListener("mousemove", this.drag);
      window.removeEventListener("mouseup", this.stopDrag);
    },
    /**
     * Handles Escape and enter keypresses.
     *
     * @param {Object} e mousemove event
     */
    handleKeydown(e) {
      if (!this.noValidation) {
        if (e.key === "Escape") {
          this.close();
        } else if (e.key === "Enter" && this.valid) {
          this.submit();
        }
      }
    },
  },
  mounted() {
    let body = document.body;
    body.appendChild(this.$el);
    this.update();
  },
  beforeDestroy() {
    let body = document.body;
    body.removeChild(this.$el);
    window.removeEventListener("keydown", this.handleKeydown);
    if (this.backdrop && this.backdropEl) {
      body.removeChild(this.backdropEl);
    }
  },
  watch: {
    value() {
      this.update();
    },
  },
};
</script>

<style>
.backdrop {
  position: fixed;
  top: 0px;
  left: 0px;
  height: 100%;
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}
</style>

<style scoped>
.popup {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: fit-content;
  background: var(--primary-light);
  user-select: none;
  overflow: hidden;
  box-shadow: -2px 2px 20px 2px black;
  z-index: 200;
  height: auto;
}
.header {
  min-height: 30px;
  width: 100%;
  padding: 0 10px;
  align-items: center;
  border-bottom: 1px solid var(--primary-dark);
  user-select: none;
  cursor: pointer;
}
.header:active {
  cursor: move;
  background: var(--secondary-darker);
}
.popup_close_icon {
  width: 12px !important;
  height: 12px !important;
  fill: var(--secondary-lighter);
  margin-left: 16px;
}
.popup_close_icon:hover {
  cursor: pointer;
}
.body {
  align-items: center;
  height: 100%;
}
.popup_validation {
  width: 100%;
  padding: 8px;
  border-top: 1px solid var(--primary-dark);
}
.popup_backdrop {
  position: fixed;
  top: 0px;
  left: 0px;
  transform: translate(-100%, 0);
  right: 0px;
  bottom: 0px;
  height: 100vh;
  width: 100vh;
  z-index: 90;
}
</style>
