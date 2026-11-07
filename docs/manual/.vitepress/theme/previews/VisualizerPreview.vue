<template>
  <div class="visualizer_preview">
    <canvas
      ref="visualizer"
      class="visualizer_preview_canvas"
    />
  </div>
</template>

<script>
import { markRaw } from 'vue';
import * as THREE from 'three';
// eslint-disable-next-line import/no-extraneous-dependencies
import { withBase } from 'vitepress';
import Visualizer from '@/plugins/visualizer/visualizer';
import { QUALITY_SETTINGS, GUIDE_SETTINGS } from '@/plugins/visualizer/quality';
import EventBus from '@/plugins/eventbus';
import { visualizerStandIn } from './host';

/**
 * The visualizer loads some assets from page-relative URLs (Studio always runs at its root): in
 * the manual they resolve from the site root
 * @param {String} url requested URL
 * @returns {String} URL to fetch
 */
function fromSiteRoot(url) {
  if (/^([a-z]+:|\/|data:|blob:)/i.test(url)) return url;
  return new URL(url, window.location.origin + withBase('/')).href;
}

/**
 * Studio's visualizer on the demo show, set up as visualizer.fragment.vue sets it up (patch from
 * the show, follows patch changes, orbit controls), rendering only while on
 * screen, at High quality (volumetric beams, light on surfaces). On unmount the WebGL context is
released and the show gets back its stand-in.
 * @displayName VisualizerPreview
 */
export default {
  name: 'VisualizerPreview',
  compatConfig: { MODE: 3 },
  async mounted() {
    THREE.DefaultLoadingManager.setURLModifier(fromSiteRoot);
    const preferences = this.$show.visualizerHandle && this.$show.visualizerHandle.showData;
    const visualizer = markRaw(new Visualizer(this.$refs.visualizer, {
      quality: {
        quality: QUALITY_SETTINGS.HIGH, scale: 1, guides: GUIDE_SETTINGS.OFF, renderScale: 1,
      },
    }));
    this.visualizer = visualizer;
    this.$show.visualizerHandle = visualizer;
    await visualizer.init();
    if (preferences) visualizer.preferences = preferences;
    // Start in front of the demo rig (two trusses, about 3 m wide each side), looking at it
    visualizer.camera.position.set(0, -24, 8);
    if (visualizer.controls) {
      visualizer.controls.target.set(0, 0, 3.5);
      visualizer.controls.update();
    }
    visualizer.fixtureRenderer.setPatch(this.$show.patchSnapshot);
    this.onPatch = () => visualizer.fixtureRenderer.setPatch(this.$show.patchSnapshot);
    EventBus.on('patch_changed', this.onPatch);
    this.resizeObserver = new ResizeObserver(() => visualizer.resize());
    this.resizeObserver.observe(this.$refs.visualizer);
    // Render only while on screen
    this.viewObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        visualizer.startRender();
        visualizer.stats.dom.style.display = 'none';
      } else {
        visualizer.stopRender();
      }
    });
    this.viewObserver.observe(this.$refs.visualizer);
  },
  beforeUnmount() {
    EventBus.off('patch_changed', this.onPatch);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.viewObserver) this.viewObserver.disconnect();
    const { visualizer } = this;
    if (!visualizer) return;
    visualizer.stopRender();
    if (this.$show.visualizerHandle === visualizer) {
      this.$show.visualizerHandle = visualizerStandIn(visualizer.showData);
    }
    if (visualizer.renderer) {
      visualizer.renderer.dispose();
      visualizer.renderer.forceContextLoss();
    }
  },
};
</script>

<style scoped>
.visualizer_preview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
}

.visualizer_preview_canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
