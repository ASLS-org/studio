<template>
  <figure class="studio_frame">
    <div
      class="vp-raw asls-scope studio_frame_body"
      :style="bodyStyle"
    >
      <slot />
    </div>
    <figcaption
      v-if="caption"
      class="studio_frame_caption"
    >
      {{ caption }}
    </figcaption>
  </figure>
</template>

<script>
/**
 * Frames Studio components inside a manual page: the app's surface, the app's element rules
 * (asls-scope.css) and no manual prose styles (vp-raw). Live previews build on it.
 * @example <StudioFrame caption="A fader"><uk-input-range-fader /></StudioFrame>
 */
export default {
  name: 'StudioFrame',
  props: {
    /**
     * Text under the frame
     * @type {String}
     */
    caption: {
      type: String,
      default: '',
    },
    /**
     * Fixed body height in px (0 = fit the content)
     * @type {Number}
     */
    height: {
      type: Number,
      default: 0,
    },
    /**
     * Inner padding in px
     * @type {Number}
     */
    padding: {
      type: Number,
      default: 16,
    },
  },
  computed: {
    /**
     * Inline size of the framed area
     * @type {Object}
     */
    bodyStyle() {
      return {
        height: this.height ? `${this.height}px` : undefined,
        padding: `${this.padding}px`,
      };
    },
  },
};
</script>

<style scoped>
.studio_frame {
  margin: 24px 0;
}

.studio_frame_body {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid var(--secondary-dark);
  background: var(--primary-light);
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.studio_frame_caption {
  margin-top: 8px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
</style>
