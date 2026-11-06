/*
 * The home page story's stage: Studio's own visualizer (showcase mode) rendering four moving heads,
 * played by story.js. The camera moves between one framing per chapter as the reader scrolls.
 * Studio's widgets live in the same 3D space through a CSS3D layer: each panel is anchored in
 * front of its chapter's camera so that it sits at 1:1 pixel size when that camera arrives, and
 * the camera passes it in true perspective on the way to the next chapter.
 *
 * Client only: import it dynamically from a mounted component.
 */
import * as THREE from 'three';
// eslint-disable-next-line import/extensions -- three's example modules need their extension
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import Visualizer from '@/plugins/visualizer/visualizer';
import FixtureLibrary from '@/models/fixtures/fixture.library';
import { PROFILE_SOURCES } from '@/models/fixtures/fixture.profile';
import {
  CHANNELS, FIXTURES, SHOW_SECONDS, SHOW_SHARE, blendFrames, program,
} from './story';

/**
 * Camera framing per chapter (Z-up, metres): position and point looked at
 * @type {Object<string, Array<Array<Number>>>}
 */
const FRAMING = {
  reveal: [[0, -32, 10], [0, 0, 4.5]],
  intro: [[0, -17, 2.6], [0, 0, 3.4]],
  channels: [[-2.2, -5.2, 4.2], [-4.5, 0, 4.6]],
  control: [[-0.5, -9.5, 2.2], [-4, 0, 2.2]],
  cues: [[0, -15, 4.2], [0, 0, 2.6]],
  chase: [[8.5, -11, 6.5], [0, 0, 2.4]],
  output: [[-7, -15, 9], [0, 0, 1.6]],
};

/**
 * Story positions in reading order: camera framing and the show played there ('reveal' is the
 * camera's start while the 2D hero opens onto the stage)
 * @type {Array<String>}
 */
export const CHAPTERS = ['reveal', 'intro', 'channels', 'control', 'cues', 'chase', 'output'];
const SHOW = {
  reveal: 'intro',
  intro: 'intro',
  channels: 'channels',
  control: 'control',
  cues: 'cues',
  chase: 'chase',
  output: 'output',
};

const ease = (x) => {
  const c = Math.min(Math.max(x, 0), 1);
  return c * c * (3 - 2 * c);
};

/**
 * Story stage: renderer, four fixtures, the show, the camera
 */
export default class StoryStage {
  /**
   * @param {HTMLCanvasElement} canvas canvas to draw into
   * @param {Object} options
   * @param {Number} options.renderScale pixel ratio (the device's, capped)
   * @param {HTMLElement} options.cssHost element the CSS3D layer is added to
   */
  constructor(canvas, { renderScale = 1, cssHost = null } = {}) {
    // Guides only: no volumetric beams, no light on surfaces, just the beam guides. A drawn look
    // that runs smoothly everywhere
    this.visualizer = new Visualizer(canvas, {
      showcase: true,
      quality: {
        quality: 'high', scale: 1, guides: 'off', renderScale,
      },
    });
    /** The universe frame the fixtures and the story's widgets read */
    this.frame = new Uint8Array(512);
    /** Story state shared with the widgets (updated in place each frame) */
    this.state = {
      chapter: 'intro',
      fade: 0,
      step: 0,
      cueId: 0,
      cueTime: 0,
      chase: 0,
      pickedCue: null,
      pickedAt: 0,
    };
    /**
     * Story position: 0..1 the reveal, then chapter i spans i..i+1 (its fraction is how far its
     * show has played)
     */
    this.position = 0;
    /** Camera pose for the current story position */
    this.camPos = new THREE.Vector3(...FRAMING.reveal[0]);
    this.camLook = new THREE.Vector3(...FRAMING.reveal[1]);
    this.from = new THREE.Vector3();
    this.to = new THREE.Vector3();
    this.lookFrom = new THREE.Vector3();
    this.lookTo = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.lastT = 0;
    /** Next chapter's opening frame, blended in during a transition (its own throwaway state) */
    this.nextFrame = new Uint8Array(512);
    this.nextState = {
      chapter: null, fade: 1, step: 0, cueId: 0, cueTime: 0, chase: 0, pickedCue: null, pickedAt: 0,
    };
    /** CSS3D layer: Studio's widgets as panels in the scene */
    this.css = new CSS3DRenderer();
    this.cssScene = new THREE.Scene();
    this.panels = [];
    this.basis = new THREE.Matrix4();
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.tilt = new THREE.Quaternion();
    this.euler = new THREE.Euler();
    this.corner = new THREE.Vector3();
    /** Pointer over the page, -1..1 on each axis (target and eased) */
    this.pointer = new THREE.Vector2();
    this.pointerEased = new THREE.Vector2();
    this.viewRight = new THREE.Vector3();
    this.viewUp = new THREE.Vector3();
    this.viewDir = new THREE.Vector3();
    /** The camera without the pointer tilt: the widget panels are rendered from it */
    this.cssCamera = new THREE.PerspectiveCamera();
    if (cssHost) cssHost.appendChild(this.css.domElement);
  }

  /**
   * Places a widget panel in the scene, in front of a chapter's camera
   * @param {HTMLElement} element panel element (managed by the CSS3D layer from now on)
   * @param {Number} index chapter index (in CHAPTERS)
   * @param {Object} layout { x, y: panel centre in screen units (-1..1), width, height: panel
   * size in px, yaw, pitch: tilt in degrees, maxWidth: largest on-screen width in px }
   * @param {?HTMLElement} blur flat layer behind the 3D layer, clipped to the panel's outline on
   * screen each frame (backdrop blur doesn't work inside CSS 3D transforms)
   */
  addPanel(element, index, layout, blur = null) {
    const object = new CSS3DObject(element);
    this.cssScene.add(object);
    const panel = {
      object,
      index,
      layout,
      blur,
      base: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      phase: this.panels.length * 1.7,
    };
    this.panels.push(panel);
    this.placePanel(panel);
  }

  /**
   * Removes every panel from the scene (their elements leave the CSS3D layer)
   */
  clearPanels() {
    this.panels.forEach(({ object }) => this.cssScene.remove(object));
    this.panels = [];
  }

  /**
   * Changes a panel's layout (e.g. after a breakpoint change)
   * @param {HTMLElement} element panel element
   * @param {Object} layout see addPanel
   */
  setPanelLayout(element, layout) {
    const panel = this.panels.find((p) => p.object.element === element);
    if (panel) {
      panel.layout = layout;
      this.placePanel(panel);
    }
  }

  /**
   * Anchors a panel: at its chapter's framing, a fixed distance in front of the camera, offset
   * to its screen position and scaled so 1 CSS px = 1 screen px when the camera is there
   * @param {Object} panel panel entry
   */
  placePanel(panel) {
    const { object, index, layout } = panel;
    const [eye, look] = FRAMING[CHAPTERS[index]];
    const { camera } = this.visualizer;
    const height = this.css.domElement.clientHeight || window.innerHeight;
    const distance = 8;
    const halfH = distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = halfH * camera.aspect;
    this.forward.set(look[0] - eye[0], look[1] - eye[1], look[2] - eye[2]).normalize();
    this.right.crossVectors(this.forward, camera.up).normalize();
    this.up.crossVectors(this.right, this.forward);
    object.position.set(eye[0], eye[1], eye[2])
      .addScaledVector(this.forward, distance)
      .addScaledVector(this.right, layout.x * halfW)
      .addScaledVector(this.up, layout.y * halfH);
    panel.base.copy(object.position);
    panel.right.copy(this.right);
    panel.up.copy(this.up);
    const fit = Math.min(1, (layout.maxWidth || Infinity) / layout.width);
    object.scale.setScalar(((2 * halfH) / height) * fit);
    // Face the camera, then tilt a little
    this.basis.makeBasis(this.right, this.up, this.forward.clone().negate());
    object.quaternion.setFromRotationMatrix(this.basis);
    this.euler.set(
      THREE.MathUtils.degToRad(layout.pitch || 0),
      THREE.MathUtils.degToRad(layout.yaw || 0),
      0,
    );
    this.tilt.setFromEuler(this.euler);
    object.quaternion.multiply(this.tilt);
  }

  /**
   * Loads the fixture profile and the renderer, patches the four heads
   * @returns {Promise<void>}
   */
  async init() {
    const profile = await FixtureLibrary.getProfile(PROFILE_SOURCES.OFL, 'martin', 'mac-aura');
    const mode = profile.modes.find((m) => m.channels.length === CHANNELS) || profile.modes[0];
    await this.visualizer.init();
    const { visualizer } = this;
    visualizer.hazeDensity = 65;
    visualizer.exposure = 140;
    visualizer.globalBrightness = 22;
    visualizer.camera.fov = 40;
    visualizer.camera.near = 0.1;
    visualizer.camera.far = 400;
    visualizer.fixtureRenderer.setPatch(FIXTURES.map((fixture) => ({
      id: fixture.index,
      universe: 0,
      chStart: fixture.index * CHANNELS,
      channels: mode.channels,
      category: profile.category,
      physical: profile.physical,
      wheels: profile.wheels,
      geometry: mode.geometry || null,
      matrix: profile.matrix || null,
      images: FixtureLibrary.wheelImages(profile),
      models: FixtureLibrary.modelFiles(profile),
      type: null,
      position: fixture.position,
      rotation: fixture.rotation,
      frame: this.frame,
    })));
  }

  /**
   * Where the reader is in the story
   * @param {Number} position 0..1 the reveal, then i..i+1 for chapter i (up to CHAPTERS.length)
   */
  setPosition(position) {
    this.position = Math.min(Math.max(position, 0), CHAPTERS.length);
  }

  /**
   * The reader picked a cue in the cue pool
   * @param {Number} id cue id
   */
  pickCue(id) {
    this.state.pickedCue = id;
    this.state.pickedAt = this.lastT;
  }

  /**
   * Where the pointer is over the page: the view tilts a little towards it
   * @param {Number} x -1 (left) … 1 (right)
   * @param {Number} y -1 (bottom) … 1 (top)
   */
  setPointer(x, y) {
    this.pointer.set(x, y);
  }

  /**
   * Follows the canvas size
   */
  resize() {
    this.visualizer.resize();
    // Portrait screens see the whole rig with a wider lens
    const { camera } = this.visualizer;
    camera.fov = camera.aspect < 1 ? 62 : 40;
    camera.updateProjectionMatrix();
    const host = this.css.domElement.parentNode;
    if (host) this.css.setSize(host.clientWidth, host.clientHeight);
    this.panels.forEach((panel) => this.placePanel(panel));
  }

  /**
   * Advances the show and draws one frame
   * @param {Number} t time in seconds
   */
  render(t) {
    const dt = Math.min(Math.max(t - this.lastT, 0), 0.1);
    this.lastT = t;

    // Chapter in view: its show plays over the first part of its scroll, then the transition to
    // the next chapter. The last chapter's show runs across its whole scroll while the final hero
    // covers the stage
    const last = CHAPTERS.length - 1;
    const index = Math.min(Math.floor(this.position), last);
    const fraction = Math.min(this.position - index, 1);
    const share = index === last ? 1 : SHOW_SHARE;
    const chapter = SHOW[CHAPTERS[index]];
    if (chapter !== this.state.chapter) {
      this.state.chapter = chapter;
      this.state.pickedCue = null;
    }
    this.state.fade = Math.min(this.position, 1);
    const showTime = Math.min(fraction / share, 1) * SHOW_SECONDS[chapter];
    program(chapter, showTime, this.frame, this.state);
    // During the transition the chapter's last state fades into the next chapter's first one
    if (index < last && fraction > share) {
      const next = SHOW[CHAPTERS[index + 1]];
      this.nextState.chapter = next;
      program(next, 0, this.nextFrame, this.nextState);
      blendFrames(this.frame, this.frame, this.nextFrame, ease((fraction - share) / (1 - share)));
    }

    // Camera, all driven by the story position: the reveal dollies in, a chapter holds its
    // framing while its show plays, then travels to the next chapter's during the transition
    const { camera } = this.visualizer;
    let from = CHAPTERS[index];
    let to = from;
    let k = 0;
    if (this.position < 1) {
      from = 'reveal';
      to = 'intro';
      k = ease(this.position);
    } else if (index < last && fraction > share) {
      to = CHAPTERS[index + 1];
      k = ease((fraction - share) / (1 - share));
    }
    const [pa, la] = FRAMING[from];
    const [pb, lb] = FRAMING[to];
    this.from.set(pa[0], pa[1], pa[2]);
    this.to.set(pb[0], pb[1], pb[2]);
    this.lookFrom.set(la[0], la[1], la[2]);
    this.lookTo.set(lb[0], lb[1], lb[2]);
    this.camPos.lerpVectors(this.from, this.to, k);
    this.camLook.lerpVectors(this.lookFrom, this.lookTo, k);
    camera.position.copy(this.camPos);
    this.look.copy(this.camLook);
    camera.lookAt(this.look);
    camera.updateMatrixWorld();
    this.cssCamera.copy(camera);
    this.cssCamera.updateProjectionMatrix();
    this.cssCamera.updateMatrixWorld();
    // Pointer tilt (the stage only): the camera swings a little around the point it looks at
    this.pointerEased.lerp(this.pointer, 1 - Math.exp(-4 * dt));
    const px = this.pointerEased.x * (0.6 + 0.4 * Math.abs(this.pointerEased.x));
    const py = this.pointerEased.y * (0.6 + 0.4 * Math.abs(this.pointerEased.y));
    const reach = camera.position.distanceTo(this.look) * 0.06;
    this.viewDir.subVectors(this.look, camera.position).normalize();
    this.viewRight.crossVectors(this.viewDir, camera.up).normalize();
    this.viewUp.crossVectors(this.viewRight, this.viewDir);
    camera.position.addScaledVector(this.viewRight, -px * reach)
      .addScaledVector(this.viewUp, -py * reach * 0.6);
    camera.lookAt(this.look);
    camera.updateProjectionMatrix();

    this.visualizer.invalidate();
    this.visualizer.render(t);
    // Panels drift a little in the scene, then the blur layers follow their outlines
    for (let i = 0; i < this.panels.length; i++) {
      const panel = this.panels[i];
      panel.object.position.copy(panel.base)
        .addScaledVector(panel.up, Math.sin(t * 0.55 + panel.phase) * 0.035)
        .addScaledVector(panel.right, Math.cos(t * 0.4 + panel.phase) * 0.025);
    }
    this.css.render(this.cssScene, this.cssCamera);
    this.updateBlurs();
  }

  /**
   * Clips each visible panel's blur layer to the panel's four corners projected on screen
   */
  updateBlurs() {
    const camera = this.cssCamera;
    const width = this.css.domElement.clientWidth;
    const height = this.css.domElement.clientHeight;
    for (let i = 0; i < this.panels.length; i++) {
      const { object, layout, blur } = this.panels[i];
      if (blur && Number(blur.style.opacity) > 0) {
        let path = '';
        let visible = true;
        for (let c = 0; c < 4 && visible; c++) {
          const sx = c === 0 || c === 3 ? -0.5 : 0.5;
          const sy = c < 2 ? -0.5 : 0.5;
          this.corner.set(sx * layout.width, sy * layout.height, 0)
            .applyMatrix4(object.matrixWorld)
            .project(camera);
          if (this.corner.z > 1 || this.corner.z < -1) visible = false;
          const x = ((this.corner.x + 1) / 2) * width;
          const y = ((1 - this.corner.y) / 2) * height;
          path += `${c ? ',' : ''}${x.toFixed(1)}px ${y.toFixed(1)}px`;
        }
        blur.style.clipPath = visible ? `polygon(${path})` : 'polygon(0 0, 0 0, 0 0)';
      }
    }
  }
}
