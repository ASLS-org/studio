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
import SceneManager from '@/plugins/visualizer/scene_manager';
import Controls from '@/plugins/visualizer/controls';
import { QUALITY_SETTINGS, GUIDE_SETTINGS } from '@/plugins/visualizer/quality';
import EventBus from '@/plugins/eventbus';
import { visualizerStandIn } from './host';
import stage from './stage';

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
 * What the camera frames (metres, Z up): the point looked at, the half extents that must fit, and
 * how much the camera looks down (rise per metre back)
 * @type {Object}
 */
const STAGE = {
  target: new THREE.Vector3(0, 0, 2.6),
  halfWidth: 9.5,
  halfHeight: 4.8,
  rise: 0.38,
};

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
  computed: {
    /**
     * What the running stage preview selects, as a comparable key (its view state's highlight)
     *
     * @type {String}
     */
    highlightKey() {
      const highlight = stage.view?.highlight;
      return highlight ? `${highlight.ids.join(',')}|${highlight.gizmo}` : '';
    },
  },
  watch: {
    highlightKey() {
      this.applySelection();
    },
  },
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
    // Studio has one scene for the page (SceneManager): keep what this visualizer adds to it
    // (floor, lights, guides) to take it out on unmount, or every later preview draws them too
    const before = new Set(SceneManager.children);
    await visualizer.init();
    // init() doesn't wait for the environment (main() loads the floor texture first): it is all in
    // the scene once its key light is
    const start = performance.now();
    const inScene = () => visualizer.globalLightHandle
      && visualizer.globalLightHandle.parent === SceneManager;
    while (!inScene() && !this.gone && performance.now() - start < 10000) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { requestAnimationFrame(resolve); });
    }
    this.added = SceneManager.children.filter((child) => !before.has(child));
    if (this.gone) {
      this.release();
      return;
    }
    if (preferences) visualizer.preferences = preferences;
    // Frame the whole stage, and keep it framed as the box resizes until the reader moves the view.
    // Auto focus (Studio's visualizer toggle) is off: selecting a fixture would fly the camera to
    // it and leave it there, and the reader should see the whole rig answer. A new visualizer
    // turns it on and starts a focus flight that ends on this camera: stop it
    visualizer.autoFocus = false;
    cancelAnimationFrame(Controls.rafID);
    this.fit();
    if (visualizer.controls) {
      visualizer.controls.addEventListener('start', () => { this.framed = true; });
    }
    visualizer.fixtureRenderer.setPatch(this.$show.patchSnapshot);
    this.applySelection();
    // As visualizer.fragment.vue: follow the patch, poses, the selection, and write back
    // positions dragged with the transform controls
    this.onPatch = () => visualizer.fixtureRenderer.setPatch(this.$show.patchSnapshot);
    this.onPose = (pose) => visualizer.fixtureRenderer.setPose(pose);
    this.onTransformed = ({ id, position, rotation }) => {
      if (!this.$show.fixturePool.checkIfExists(id)) return;
      const fixture = this.$show.fixturePool.getFromId(id);
      if (position) fixture.position = position;
      if (rotation) fixture.rotation = rotation;
    };
    EventBus.on('patch_changed', this.onPatch);
    EventBus.on('fixture_pose', this.onPose);
    EventBus.on('fixture_transformed', this.onTransformed);
    this.resizeObserver = new ResizeObserver(() => {
      visualizer.resize();
      if (!this.framed) this.fit();
    });
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
    this.gone = true;
    EventBus.off('patch_changed', this.onPatch);
    EventBus.off('fixture_pose', this.onPose);
    EventBus.off('fixture_transformed', this.onTransformed);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.viewObserver) this.viewObserver.disconnect();
    // Still starting: mounted() releases it once init is done
    if (this.added) this.release();
  },
  methods: {
    /**
     * Shows the running stage preview's selection (highlight and transform controls)
     */
    applySelection() {
      const highlight = stage.view?.highlight;
      if (!this.visualizer?.fixtureRenderer || this.gone) return;
      this.visualizer.fixtureRenderer.setSelection(
        highlight ? highlight.ids : [],
        highlight ? highlight.gizmo : false,
      );
    },
    /**
     * Places the camera in front of the demo rig, a little above it, far enough for the whole
     * stage to fit the box (four heads hung 6 m up, 9 m apart, their beams fanned up to 9 m out)
     * @public
     */
    fit() {
      const { camera, controls } = this.visualizer;
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const distance = Math.max(STAGE.halfHeight / tan, STAGE.halfWidth / (tan * camera.aspect));
      const direction = new THREE.Vector3(0, -1, STAGE.rise).normalize();
      camera.position.copy(STAGE.target).addScaledVector(direction, distance);
      if (controls) {
        controls.target.copy(STAGE.target);
        controls.update();
      } else {
        camera.lookAt(STAGE.target);
      }
    },
    /**
     * Stops rendering, takes this visualizer's fixtures and environment out of the shared scene,
     * releases the WebGL context and gives the show back its stand-in
     * @public
     */
    release() {
      const { visualizer } = this;
      if (!visualizer) return;
      this.visualizer = null;
      visualizer.stopRender();
      if (visualizer.fixtureRenderer) visualizer.fixtureRenderer.setPatch([]);
      (this.added || []).forEach((child) => SceneManager.remove(child));
      if (this.$show.visualizerHandle === visualizer) {
        this.$show.visualizerHandle = visualizerStandIn(visualizer.showData);
      }
      if (visualizer.renderer) {
        visualizer.renderer.dispose();
        visualizer.renderer.forceContextLoss();
      }
    },
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
