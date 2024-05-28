<template>
  <Transition name="bounce">
    <uk-flex
      v-if="displayed"
      col
      class="popup"
    >
      <uk-flex
        v-if="!noHeader"
        class="header"
        @mousedown="startDrag"
        @mouseup="stopDrag"
      >
        <img
          v-if="header.icon"
          :src="header.icon"
        >
        <h3>{{ header.title }}</h3>
        <span style="flex: 1" />
        <uk-icon
          class="popup_close_icon"
          name="new"
          @click="close()"
        />
      </uk-flex>
      <uk-flex class="body">
        <slot />
      </uk-flex>
      <uk-flex
        v-if="!noValidation"
        class="popup_validation"
        :gap="8"
      >
        <uk-spacer />
        <uk-button
          v-if="cancelable"
          :label="cancelTxt"
          @click="cancel()"
        />
        <uk-button
          :disabled="!valid"
          :label="validateTxt"
          @click="submit()"
        />
      </uk-flex>
    </uk-flex>
  </Transition>
</template>

<script>
/**
 * @namespace uikit/popup
 * @component Popup A slotted popup component that will automatically be appended to app's body.
 * @story Default {"header":{"title":"Default"},"value":true}
 */
export default {
  name: 'UkPopup',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Header definition object:
     * {Title: "String"}
     */
    header: {
      type: Object,
      default: null,
    },
    /**
     * Popup's display state
     */
    modelValue: {
      type: Boolean,
      default: false,
    },
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
     * Whether the popup's backdrop is opaque or not
     */
    opaque: {
      type: Boolean,
      default: false,
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
    onCancel: {
      type: Function,
      default: () => {},
    },
    /**
     * Custom validation button text
     */
    validateTxt: {
      type: String,
      default: 'ok',
    },
    /**
     * Custom cancellation button text
     */
    cancelTxt: {
      type: String,
      default: 'cancel',
    },
  },
  emits: ['update:modelValue', 'input', 'submit'],
  data() {
    return {
      /**
       * The popup's display state (Reactive)
       */
      displayed: this.modelValue,
    };
  },
  watch: {
    modelValue() {
      this.update();
    },
  },
  mounted() {
    const { body } = document;
    body.appendChild(this.$el);
    this.update();
  },
  beforeUnmount() {
    const { body } = document;
    // if (body.contains(this.$el)) {
    //   console.log(body.contains(this.$el));
    //   console.log(this.$el, body);
    //   body.removeChild(this.$el);
    // }
    window.removeEventListener('keydown', this.handleKeydown);
    if (this.backdrop && this.backdropEl) {
      body.removeChild(this.backdropEl);
    }
    if (this.opaque) {
      const app = document.getElementById('app');
      if (app) {
        app.classList.remove('blurred-sm');
      }
    }
  },
  methods: {
    /**
     * Update popup based on provided properties
     *
     */
    update() {
      window.removeEventListener('keydown', this.handleKeydown);
      const { body } = document;
      this.displayed = this.modelValue;
      if (this.displayed) {
        window.addEventListener('keydown', this.handleKeydown);
      }
      if (this.displayed && this.backdrop) {
        this.backdropEl = document.createElement('div');
        this.backdropEl.className = `backdrop${this.opaque ? ' opaque' : ''}`;
        body.appendChild(this.backdropEl);
        if (this.opaque) {
          const app = document.getElementById('app');
          if (app) {
            app.classList.add('blurred-sm');
          }
        }
      } else if (this.backdrop && this.backdropEl) {
        body.removeChild(this.backdropEl);
        if (this.opaque) {
          const app = document.getElementById('app');
          if (app) {
            app.classList.remove('blurred-sm');
          }
        }
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
      this.$emit('update:modelValue', this.displayed);
      this.$emit('input', this.displayed);
      window.removeEventListener('keydown', this.handleKeydown);
    },
    cancel() {
      if (!this.onCancel) {
        this.close();
      } else {
        this.onCancel();
        this.close();
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
        this.$emit('submit');
      }
    },
    /**
     * Prepare popup dragging procedure
     *
     */
    startDrag(e) {
      if (this.movable) {
        window.addEventListener('mousemove', this.drag);
        window.addEventListener('mouseup', this.stopDrag);
        const bb = this.$el.getBoundingClientRect();
        this.offsetX = bb.left - e.clientX + bb.width / 2;
      }
    },
    /**
     * Drag popup element
     *
     * @param {Object} e mousemove event
     */
    drag(e) {
      const box = this.$el.getBoundingClientRect();
      this.$el.style.left = `${Math.min(Math.max(e.clientX + this.offsetX, box.width / 2), window.innerWidth - box.width / 2)}px`;
      this.$el.style.top = `${Math.min(Math.max(e.clientY + box.height / 2 - 15, box.height / 2), window.innerHeight - box.height / 2)}px`;
    },
    /**
     * End popup dragging procedure
     *
     */
    stopDrag() {
      window.removeEventListener('mousemove', this.drag);
      window.removeEventListener('mouseup', this.stopDrag);
    },
    /**
     * Handles Escape and enter keypresses.
     *
     * @param {Object} e mousemove event
     */
    handleKeydown(e) {
      if (e.repeat) return;
      if (!this.noValidation) {
        if (e.key === 'Escape') {
          this.close();
        } else if (e.key === 'Enter' && this.valid) {
          this.submit();
        }
      }
    },
  },
};
</script>

<style scoped>
.bounce-enter-active {
  animation: bounce-in 0.1s;
}
.bounce-leave-active {
  animation: bounce-in 0.1s reverse;
}
@keyframes bounce-in {
  0% {
    scale: 1;
    opacity: 0;
  }
  50% {
    scale: 1.01;
    opacity: 0.8;
  }
  100% {
    scale: 1;
    opacity: 1;
  }
}
</style>

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
  box-shadow: -2px 2px 20px 2px var(--primary-dark);
  border: 1px solid var(--secondary-darker);
  border-radius: 5px;
  z-index: 200;
  height: auto;
  transform-origin: 50% 50%;
}
.header {
  min-height: 30px;
  width: 100%;
  padding: 0 10px;
  align-items: center;
  background: var(--secondary-darker);
  user-select: none;
}
.header:active {
  cursor: move;
  background: var(--secondary-darker);
}
.popup_close_icon {
  width: 16px !important;
  height: 16px !important;
  fill: var(--accent-red);
  opacity: .8;
  transform: rotate(45deg);
  margin-left: 16px;
}
.popup_close_icon:hover {
  cursor: pointer;
  opacity: 1;
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
