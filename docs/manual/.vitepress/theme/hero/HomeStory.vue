<template>
  <section
    ref="story"
    class="story"
    :class="{ ready, fallback, still }"
    :style="{ height: `${totalLength + 100}vh` }"
  >
    <div class="story_sticky">
      <!-- The stage (Studio's visualizer) and its widgets, in one 3D space -->
      <div
        ref="stage"
        class="story_stage"
        :style="stageStyle"
      />
      <canvas
        ref="reveal"
        class="story_reveal"
        :class="{ done: morph >= 1 && outro <= 0 }"
      />
      <div
        class="story_blurs"
        aria-hidden="true"
      >
        <div
          v-for="panel in panels"
          :key="panel.id"
          :ref="(el) => { if (el) blurElements[panel.id] = el; }"
          class="story_blur"
          :style="{ opacity: panelPresence(panel) }"
        />
      </div>
      <div
        ref="css"
        class="story_css"
      />

      <!-- 2D hero: what the visitor sees first -->
      <header
        class="story_hero"
        :style="heroStyle"
      >
        <img
          class="story_logo"
          :src="logo"
          alt="ASLS Studio"
          width="383"
          height="144"
        >
        <h1 class="story_hero_title">
          Program the light. See it live.
        </h1>
        <p class="story_hero_sub">
          Open-source DMX lighting control with a real-time 3D visualizer, in your browser or on
          the desktop.
        </p>
        <div class="story_actions">
          <a
            v-if="$links.demo"
            class="story_btn primary"
            :href="$links.demo"
            target="_blank"
            rel="noreferrer"
          >Try the live demo</a>
          <a
            v-if="$links.download"
            class="story_btn"
            :class="{ primary: !$links.demo }"
            :href="$links.download"
            target="_blank"
            rel="noreferrer"
          >Download</a>
          <a
            class="story_btn"
            :href="withBase('/introduction/')"
          >Read the manual</a>
        </div>
      </header>

      <!-- Final hero: the stage dissolves back, as the first hero in reverse -->
      <section
        class="story_hero story_outro"
        :style="outroStyle"
        :aria-hidden="outro < 0.5"
      >
        <img
          class="story_logo"
          :src="logo"
          alt="ASLS Studio"
          width="383"
          height="144"
        >
        <h2 class="story_hero_title">
          Your next show starts here.
        </h2>
        <p class="story_hero_sub">
          Free and open source. Run Studio in your browser, or download it for macOS, Windows and
          Linux, and take it to your rig.
        </p>
        <div class="story_actions">
          <a
            v-if="$links.download"
            class="story_btn primary"
            :href="$links.download"
            target="_blank"
            rel="noreferrer"
          >Download</a>
          <a
            v-if="$links.demo"
            class="story_btn"
            :class="{ primary: !$links.download }"
            :href="$links.demo"
            target="_blank"
            rel="noreferrer"
          >Try the live demo</a>
          <a
            class="story_btn"
            :href="withBase('/introduction/')"
          >Read the manual</a>
        </div>
        <button
          type="button"
          class="story_replay"
          @click="backToTop"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
          ><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.4h2.4" /></svg>
          Replay
        </button>
      </section>

      <!-- Chapter copy: on screen for its whole chapter, switching at the chapter's end -->
      <article
        v-for="(chapter, i) in scenes"
        :key="chapter.id"
        class="story_copy"
        :class="`pos_${copyPosition(chapter)}`"
        :style="copyStyle(i + 1, chapter)"
        :aria-hidden="current !== i + 1"
      >
        <span
          class="story_progress"
          aria-hidden="true"
        >
          <span :style="{ transform: `scaleX(${stepProgress(i + 1)})` }" />
        </span>
        <p class="story_count">
          {{ pad(i + 1) }}<span> / {{ pad(scenes.length) }}</span>
        </p>
        <p class="story_kicker">
          <span class="story_dot" />
          {{ chapter.kicker }}
        </p>
        <h2 class="story_heading">
          {{ chapter.heading }}
        </h2>
        <p class="story_text">
          {{ chapter.text }}
        </p>
        <div class="story_controls">
          <button
            type="button"
            class="story_play"
            :class="{ playing: autoplaying }"
            @click="toggleAutoplay"
          >
            <svg
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <path
                v-if="autoplaying"
                d="M3 2h2v8H3zM7 2h2v8H7z"
              />
              <path
                v-else
                d="M3 1.5v9l7.5-4.5z"
              />
            </svg>
            {{ autoplaying ? 'Pause' : 'Autoplay' }}
          </button>
          <button
            type="button"
            class="story_play story_next"
            @click="next(i + 2)"
          >
            Next
            <svg
              viewBox="0 0 12 12"
              aria-hidden="true"
            ><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>
          </button>
        </div>
      </article>

      <!-- Scroll cue on every step but the last, where Back to top takes its place -->
      <button
        type="button"
        class="story_hint"
        :style="hintStyle"
        @click="goTo(Math.min(current + 1, chapters.length - 1))"
      >
        <span class="story_hint_label">{{ position < 0.5 ? 'Scroll to discover' : 'Scroll' }}</span>
        <span class="story_hint_line" />
        <svg
          class="story_hint_chevron"
          viewBox="0 0 16 10"
          aria-hidden="true"
        ><path d="M2 2l6 6 6-6" /></svg>
      </button>

      <!-- Progress rail -->
      <nav
        class="story_rail"
        :style="{ opacity: smooth(morph) * (1 - smooth(outro * 2)) }"
        aria-label="Story chapters"
      >
        <span class="story_rail_track">
          <span
            class="story_rail_fill"
            :style="{ transform: `scaleY(${railFill})` }"
          />
        </span>
        <button
          v-for="(chapter, i) in scenes"
          :key="chapter.id"
          type="button"
          class="story_rail_item"
          :class="{ active: current === i + 1, done: current > i + 1 }"
          :style="{
            top: `${(i / (scenes.length - 1)) * 100}%`,
            '--chapter-color': `var(${chapter.token})`,
          }"
          :aria-label="chapter.kicker"
          @click="goTo(i + 1)"
        >
          <span class="story_rail_label">{{ chapter.kicker }}</span>
          <span class="story_rail_dot" />
        </button>
      </nav>
    </div>

    <!-- Studio's widgets: handed to the stage's CSS3D layer once it is ready -->
    <div class="story_panels">
      <div
        v-for="panel in panels"
        :key="panel.id"
        :ref="(el) => { if (el) panelElements[panel.id] = el; }"
        class="story_anchor"
        inert
      >
        <div
          class="story_panel"
          :style="panelStyle(panel)"
        >
          <ChannelsWidget
            v-if="panel.id === 'channels'"
            :channels="channels"
          />
          <ColorPicker
            v-else-if="panel.id === 'color'"
            :rgb-data="color"
            :model-value="color"
          />
          <PanTilt
            v-else-if="panel.id === 'pantilt'"
            :pan-tilt="panTilt"
          />
          <CuePool
            v-else-if="panel.id === 'cues'"
            :group="group"
          />
          <ChaseTimeline
            v-else-if="panel.id === 'chase'"
            ref="timeline"
            :pool="chase"
          />
          <UniverseView
            v-else-if="panel.id === 'output'"
            :values="universe"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { withBase } from 'vitepress';
import { markRaw } from 'vue';
import ChannelsWidget from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.fixture.channels.vue';
import ColorPicker from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.colorpicker.vue';
import PanTilt from '@/views/activities/app/fragments/modifiers/_widgets/modifier.widget.pantilt.vue';
import CuePool from '@/views/activities/app/fragments/modifiers/group/_widgets/group.modifier.widget.cuepool.vue';
import ChaseTimeline from '@/views/activities/app/fragments/modifiers/chase/_widgets/chase.modifier.widget.timeline.vue';
// eslint-disable-next-line import/no-unresolved -- Vite asset URL import
import logo from '@/assets/images/studio_logo_textual.svg?url';
import UniverseView from './UniverseView.vue';
import ManualTicker from './ticker';
import {
  BAR, BEAT, CHANNELS, CHANNEL_DEFS, CUES, CHASE, SHOW_SECONDS, SHOW_SHARE, colorOf,
} from './story';

/**
 * The stage while the home page is mounted (disposed when the reader leaves it: its WebGL context
 * and its rig in Studio's shared scene must not outlive the page)
 * @type {?{stage: Object, canvas: HTMLCanvasElement, ready: Promise}}
 */
let cached = null;

/**
 * The reader's scrolling plays the story like a player (forward, or backward when scrolling up)
 * at this many times real time; Autoplay plays at real time
 * @type {Number}
 */
const PLAY_SPEED = 1.6;

/**
 * Seconds the playback speed takes to ease in when the reader starts scrolling, and to ease out
 * when they stop (along a smoothstep, so it starts and settles softly)
 * @type {Object}
 */
const RAMP = { in: 0.45, out: 0.7 };

/**
 * How long (ms) an input keeps the story playing after its last event: a wheel notch, a touch
 * move, a key press (a key's auto-repeat keeps it going)
 * @type {Object}
 */
const HOLD = { wheel: 260, touch: 140, key: 500 };

/**
 * Scene chapters (after the 2D hero): copy, accent token, where the copy sits
 * @type {Array<Object>}
 */
const SCENES = [{
  id: 'intro',
  kicker: 'The stage',
  token: '--accent-blue',
  side: 'left',
  heading: 'Rendered by Studio, live',
  text: 'This is Studio’s own visualizer running in your browser: four moving heads in haze, driven by DMX, frame by frame. Keep scrolling to program them.',
}, {
  id: 'channels',
  kicker: 'Patch',
  token: '--accent-maroon',
  side: 'right',
  heading: 'Every channel, under your fingers',
  text: 'Patch a fixture from the Open Fixture Library or a GDTF file and its channels are ready to drive. Watch this MAC Aura run through shutter, dimmer, zoom, pan, tilt and colour.',
}, {
  id: 'control',
  kicker: 'Control',
  token: '--accent-violet',
  side: 'left',
  heading: 'Widgets that speak lighting',
  text: 'Pick a colour, drag pan and tilt: Studio turns them into the right values for each fixture. The colour picker and the pan/tilt pad follow the light.',
}, {
  id: 'cues',
  kicker: 'Program',
  token: '--accent-pink',
  side: 'right',
  heading: 'Groups and cues',
  text: 'Gather fixtures into a group and build its cues: scenes hold a look, effects move channels with waveforms. Fire one and the stage follows.',
}, {
  id: 'chase',
  kicker: 'Sequence',
  token: '--accent-blue',
  side: 'left',
  heading: 'Chases, in bars, on the beat',
  text: 'Lay cues out on a bar timeline and quantize them to the beat. Studio keeps everything in time with the BPM, whatever the tempo.',
}, {
  id: 'output',
  kicker: 'Output',
  token: '--accent-sea-green',
  side: 'right',
  heading: 'From the browser to the rig',
  text: 'Every frame becomes DMX: 512 channels per universe, sent over Art-Net, sACN or USB DMX through the WSC gateway.',
}];

/**
 * Widget panels: chapter, size (px), where they float (screen units), tilt (degrees)
 * @type {Array<Object>}
 */
const PANELS = [
  {
    id: 'channels', chapter: 'channels', width: 742, height: 250, x: -0.3, y: -0.4, yaw: 10, pitch: -5,
  },
  {
    id: 'pantilt', chapter: 'control', width: 410, height: 250, x: 0.5, y: 0.36, yaw: -14, pitch: 5,
  },
  {
    id: 'color', chapter: 'control', width: 560, height: 250, x: 0.38, y: -0.42, yaw: -10, pitch: -5,
  },
  {
    id: 'cues', chapter: 'cues', width: 452, height: 300, x: -0.4, y: -0.04, yaw: 14, pitch: 2,
  },
  {
    id: 'chase', chapter: 'chase', width: 1040, height: 240, x: 0.02, y: -0.5, yaw: -4, pitch: -10,
  },
  {
    id: 'output', chapter: 'output', width: 780, height: 250, x: -0.28, y: -0.42, yaw: 10, pitch: -5,
  },
];

const clamp = (x, a = 0, b = 1) => Math.min(Math.max(x, a), b);

/**
 * Scroll length of each chapter in vh: the hero's reveal, each scene (its show plays across its
 * length), and the final hero
 * @type {Array<Number>}
 */
// Momentum doesn't move the story, so a chapter takes less scrolling than a page normally would
const LENGTHS = [100, 85, 120, 120, 135, 135, 80, 40];

/**
 * Where, in the last scene, the final hero starts to take over (its show keeps running under it)
 * @type {Number}
 */
const OUTRO_FROM = 0.55;

/**
 * Whether this browser can create the WebGL 2 context the visualizer needs
 * @returns {Boolean}
 */
function hasWebGL2() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch (e) {
    return false;
  }
}

/**
 * Render resolution: the device's pixel ratio, capped at 2 (1.5 on phones); the visualizer's Auto
 * quality then adapts the lighting to the frame time
 * @returns {Object} { renderScale }
 */
function deviceTier() {
  const small = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  return { renderScale: Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2) };
}

/**
 * Home page story. It opens on a 2D hero; scrolling dissolves it into a stage of four moving
 * heads rendered by Studio's visualizer, then walks through Studio chapter by chapter, with the
 * app's own widgets placed in the scene, running on the show (channels, colour picker, pan/tilt,
 * cue pool, chase timeline, DMX output).
 */
export default {
  name: 'HomeStory',
  components: {
    ChannelsWidget, ColorPicker, PanTilt, CuePool, ChaseTimeline, UniverseView,
  },
  data() {
    const style = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const tokenColor = (token) => (style ? style.getPropertyValue(token).trim() : '');
    const cues = CUES.map((cue) => ({
      id: cue.id,
      name: cue.name,
      type: cue.type,
      color: tokenColor(cue.token),
      state: false,
      chaseActive: false,
      time: 0,
      durationMS: BAR * 2 * 1000,
      cue: () => {},
    }));
    return {
      logo,
      scenes: SCENES,
      lengths: LENGTHS,
      chapters: [{ id: 'hero' }, ...SCENES, { id: 'outro' }],
      panels: PANELS,
      panelElements: {},
      blurElements: {},
      position: 0,
      target: 0,
      playing: false,
      autoplaying: false,
      ready: false,
      fallback: false,
      still: false,
      narrow: false,
      channels: CHANNEL_DEFS.map((def) => ({ ...def, value: 0, active: true })),
      color: [255, 255, 255],
      panTilt: {
        pan: 128, panFine: 0, tilt: 128, tiltFine: 0,
      },
      group: {
        color: tokenColor('--accent-pink'),
        fixturePool: { fixtures: [] },
        cuePool: { cues, getFromId: (id) => cues.find((c) => c.id === id) },
        deleteCue: () => {},
      },
      chase: {
        barSubDiv: CHASE.beatsPerBar,
        duration: CHASE.bars,
        actualDuration: CHASE.bars,
        tickDuration: BEAT * 1000,
        elapsedPerc: 0,
        update: () => {},
        cues: cues.map((cue) => ({
          name: cue.name,
          cue,
          items: CHASE.items
            .filter((item) => item.cueId === cue.id)
            .map((item) => ({
              tick: item.tick,
              length: item.length,
              color: cue.color,
              name: cue.name,
              handle: { fadeIn: null },
            })),
        })),
      },
      universe: new Array(CHANNELS * 4).fill(0),
    };
  },
  computed: {
    /**
     * Scroll cue: once scrolling is idle and the story has caught up, everywhere but the final
     * hero
     * @type {Object}
     */
    hintStyle() {
      const p = this.playing ? 0 : 1 - this.smooth(this.outro * 2);
      return {
        opacity: p,
        visibility: p > 0.001 ? 'visible' : 'hidden',
        pointerEvents: p > 0.6 ? 'auto' : 'none',
        // Hidden: its animations pause (they'd restyle the page every frame for nothing)
        '--hint-run': p > 0.001 ? 'running' : 'paused',
      };
    },
    /**
     * How much of the rail is filled, 0..1
     * @type {Number}
     */
    railFill() {
      return clamp((this.position - 1) / this.scenes.length);
    },
    /**
     * Total scroll length of the story (vh)
     * @type {Number}
     */
    totalLength() {
      return this.lengths.reduce((sum, length) => sum + length, 0);
    },
    /**
     * Where each chapter starts in the story's scroll (vh)
     * @type {Array<Number>}
     */
    starts() {
      let sum = 0;
      return this.lengths.map((length) => {
        const start = sum;
        sum += length;
        return start;
      });
    },
    /**
     * Index of the chapter in view (0 = the 2D hero)
     * @type {Number}
     */
    current() {
      return Math.max(0, Math.min(Math.floor(this.position), this.chapters.length - 1));
    },
    /**
     * Id of the chapter in view
     * @type {String}
     */
    chapterId() {
      return this.chapters[this.current].id;
    },
    /**
     * How far the hero has dissolved into the stage, 0..1
     * @type {Number}
     */
    morph() {
      return clamp(this.position);
    },
    /**
     * Hero: blurs, fades and steps back a little as the stage appears
     * @type {Object}
     */
    heroStyle() {
      const m = this.smooth(clamp(this.morph * 1.25));
      return {
        opacity: 1 - m,
        transform: `scale(${1 - m * 0.06})`,
        filter: m > 0.01 ? `blur(${m * 14}px)` : 'none',
        pointerEvents: m > 0.4 ? 'none' : 'auto',
        visibility: m >= 1 ? 'hidden' : 'visible',
      };
    },
    /**
     * How far the final hero has taken over, 0..1: it arrives over the end of the last scene, while
     * its show still runs, and is complete when that show ends
     * @type {Number}
     */
    outro() {
      return clamp((this.position - (this.chapters.length - 2) - OUTRO_FROM) / (1 - OUTRO_FROM));
    },
    /**
     * Final hero: sharpens and fades in as the stage dissolves back (the first hero in reverse)
     * @type {Object}
     */
    outroStyle() {
      const m = this.smooth(this.outro);
      return {
        opacity: m,
        transform: `scale(${0.94 + m * 0.06})`,
        filter: m < 0.99 ? `blur(${(1 - m) * 14}px)` : 'none',
        pointerEvents: m > 0.6 ? 'auto' : 'none',
        visibility: m > 0.001 ? 'visible' : 'hidden',
      };
    },
    /**
     * Stage: hidden before the reveal, settling from a slight zoom as it appears
     * @type {Object}
     */
    stageStyle() {
      const m = this.smooth(this.morph);
      return {
        opacity: this.morph > 0 ? 1 : 0,
        transform: `scale(${1.05 - m * 0.05})`,
      };
    },
  },
  watch: {
    /**
     * The timeline sizes its grid from its own width, which only exists once the 3D layer has
     * attached its panel: let it measure (once, directly) when its chapter is first reached
     */
    chapterId(id) {
      if (id !== 'chase' || this.timelineMeasured) return;
      this.timelineMeasured = true;
      requestAnimationFrame(() => {
        const [timeline] = [].concat(this.$refs.timeline || []);
        if (timeline && timeline.handleWindowResize) timeline.handleWindowResize();
      });
    },
  },
  async mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    // Inside the story, the wheel, swipes and keys play it (forward or back) instead of scrolling
    // the page: not passive, so they can be kept from scrolling
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.updateLoop);
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.updateLoop();
    });
    this.observer.observe(this.$refs.story);
    this.visible = true;
    this.narrow = window.innerWidth < 768;
    this.measure();
    this.onScroll();
    if (!hasWebGL2()) {
      this.fallback = true;
      return;
    }
    this.still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      const dark = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark');
      const { default: LiquidReveal } = await import('./reveal');
      this.reveal = markRaw(new LiquidReveal(this.$refs.reveal, dark.trim() || '#0b0d0a'));
      this.drawReveal(0);
      const canvas = document.createElement('canvas');
      this.$refs.stage.appendChild(canvas);
      const { default: StoryStage } = await import('./stage');
      if (this.unmounted) return;
      const stage = new StoryStage(canvas, { ...deviceTier(), cssHost: this.$refs.css });
      cached = { stage: markRaw(stage), canvas, ready: stage.init() };
      await cached.ready;
      if (this.unmounted) return;
      cached.stage.resize();
      this.panels.forEach((panel) => {
        cached.stage.addPanel(
          this.panelElements[panel.id],
          this.chapterIndex(panel.chapter),
          this.panelLayout(panel),
          this.blurElements[panel.id],
        );
      });
      // The page has its final layout now: measure where the story sits, then follow the scroll
      this.measure();
      this.onScroll();
      if (import.meta.env.DEV) {
        window.__aslsStory = cached.stage;
        window.__aslsStoryVm = this;
      }
      this.ready = true;
      if (this.still) {
        cached.stage.render(4);
        this.sync();
      } else {
        this.updateLoop();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('ASLS story: falling back to a static backdrop', error);
      this.fallback = true;
    }
  },
  beforeUnmount() {
    this.unmounted = true;
    this.stopGlide();
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('pointermove', this.onPointer);
    this.stopLoop();
    this.observer.disconnect();
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.updateLoop);
    if (cached) {
      const { stage, canvas, ready } = cached;
      cached = null;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      ready.then(() => stage.dispose(), () => stage.dispose());
    }
    if (this.reveal) this.reveal.dispose();
  },
  methods: {
    withBase,
    /**
     * Smoothstep easing
     * @param {Number} x 0..1
     * @returns {Number} eased 0..1
     */
    smooth(x) {
      const c = clamp(x);
      return c * c * (3 - 2 * c);
    },
    /**
     * How far a chapter's show has played, 0..1 (its progress bar)
     * @param {Number} i chapter index
     * @returns {Number} progress
     */
    stepProgress(i) {
      return clamp((this.position - i) / (i === this.scenes.length ? 1 : SHOW_SHARE));
    },
    /**
     * Two-digit chapter number
     * @param {Number} n chapter number
     * @returns {String} e.g. "03"
     */
    pad(n) {
      return String(n).padStart(2, '0');
    },
    /**
     * Index of a chapter in the story (0 = the 2D hero)
     * @param {String} id chapter id
     * @returns {Number} index
     */
    chapterIndex(id) {
      return this.chapters.findIndex((c) => c.id === id);
    },
    /**
     * How present chapter i is at the current scroll position, 0..1
     * @param {Number} i chapter index
     * @returns {Number} presence
     */
    presence(i) {
      const half = (1 - SHOW_SHARE) / 2;
      const f = this.position - i;
      if (i === 1 && f < 0) return this.smooth((this.position - 0.85) / 0.15);
      if (f < 0) {
        // Arriving: fades in during the second half of the previous chapter's transition
        return this.smooth((f + half) / half);
      }
      if (i === this.scenes.length) {
        // The last scene's copy gives way as the final hero arrives
        const out = OUTRO_FROM + (1 - OUTRO_FROM) * 0.5;
        return f <= OUTRO_FROM ? 1 : 1 - this.smooth((f - OUTRO_FROM) / (out - OUTRO_FROM));
      }
      if (f <= SHOW_SHARE) return 1;
      // Leaving: fades out during the first half of its own transition
      return 1 - this.smooth((f - SHOW_SHARE) / half);
    },
    /**
     * Where a chapter's copy sits (phones: always at the top)
     * @param {Object} chapter chapter
     * @returns {String} 'left' | 'right' | 'top'
     */
    copyPosition(chapter) {
      return this.narrow ? 'top' : chapter.side;
    },
    /**
     * Chapter copy: on screen for its whole chapter, crossfading at its edges
     * @param {Number} i chapter index
     * @param {Object} chapter chapter
     * @returns {Object} style
     */
    copyStyle(i, chapter) {
      const p = this.presence(i);
      // A slight rise while its chapter plays
      const rise = (0.5 - clamp((this.position - i) / SHOW_SHARE)) * 28;
      return {
        '--chapter-color': `var(${chapter.token})`,
        opacity: p,
        transform: `translate3d(0, ${rise}px, 0)`,
        pointerEvents: p > 0.6 ? 'auto' : 'none',
        visibility: p > 0.001 ? 'visible' : 'hidden',
      };
    },
    /**
     * A panel's placement for the current screen size
     * @param {Object} panel panel definition
     * @returns {Object} layout for the stage
     */
    panelLayout(panel) {
      const vw = window.innerWidth;
      if (this.narrow) {
        return {
          ...panel, x: 0, y: -0.58, yaw: 0, pitch: 0, maxWidth: vw - 24,
        };
      }
      return { ...panel, maxWidth: panel.id === 'chase' ? vw * 0.74 : vw * 0.56 };
    },
    /**
     * How present a panel is, 0..1 (it fades with its chapter; phones skip the pan/tilt panel)
     * @param {Object} panel panel definition
     * @returns {Number} presence
     */
    panelPresence(panel) {
      if (this.narrow && panel.id === 'pantilt') return 0;
      return this.presence(this.chapterIndex(panel.chapter));
    },
    /**
     * Panel: size and presence (it fades with its chapter)
     * @param {Object} panel panel definition
     * @returns {Object} style
     */
    panelStyle(panel) {
      const p = this.panelPresence(panel);
      return {
        width: `${panel.width}px`,
        height: `${panel.height}px`,
        opacity: p * 0.94,
        visibility: p > 0.001 ? 'visible' : 'hidden',
      };
    },
    /**
     * Runs the frame loop while there is something to draw: the stage once it starts to appear,
     * a playback, a seek. On screen and with the tab visible only
     */
    updateLoop() {
      const busy = this.dir || this.seekAnim || this.follow || this.autoplaying
        || performance.now() - (this.inputAt || 0) < 400;
      const run = this.ready && !this.still && this.visible && !document.hidden
        && (this.position > 0.01 || busy);
      if (run && !this.frameId) {
        let n = 0;
        let last = performance.now();
        const tick = (now) => {
          const t = now / 1000;
          // rAF timestamps can precede the moment the loop started: never a negative step
          const dt = Math.min(Math.max((now - last) / 1000, 0), 0.1);
          last = now;
          this.advance(now, dt);
          cached.stage.setPosition(this.position);
          cached.stage.render(t);
          if (this.morph < 1 || this.outro > 0) this.drawReveal(t);
          n += 1;
          if (n % 3 === 0) this.sync();
          // Resting on the first hero, or under the final one: nothing to draw until the next
          // input or scroll starts the loop again
          const end = this.chapters.length - 1;
          const idle = !this.dir && !this.seekAnim && !this.follow && !this.autoplaying
            && now - (this.inputAt || 0) > 400;
          if (idle && (this.position < 0.001 || this.position > end - 0.001)) {
            this.frameId = null;
            return;
          }
          this.frameId = requestAnimationFrame(tick);
        };
        this.frameId = requestAnimationFrame(tick);
      } else if (!run) {
        this.stopLoop();
      }
    },
    /**
     * Playback speed (story units per second, at real time) where the story is: a chapter's show
     * plays at its own pace, a move between chapters takes 0.7 s, the reveal 1.2 s, the last
     * show runs across its whole chapter while the final hero arrives
     * @param {Number} position story position
     * @param {Number} dir 1 forward, -1 back
     * @returns {Number} rate
     */
    rateAt(position, dir) {
      const last = this.chapters.length - 1;
      const index = clamp(Math.floor(position + (dir < 0 ? -1e-6 : 0)), 0, last);
      if (index === 0) return 1 / 1.2;
      if (index >= last - 1) return 1 / SHOW_SECONDS[this.chapters[last - 1].id];
      const { id } = this.chapters[index];
      return position - index < SHOW_SHARE
        ? SHOW_SHARE / SHOW_SECONDS[id]
        : (1 - SHOW_SHARE) / 0.7;
    },
    /**
     * One frame of the player. A seek (rail, Next, Replay) runs its eased course. Otherwise the
     * reader's input (or Autoplay) sets a direction, and the speed eases in towards it along a
     * smoothstep, eases out when the input stops, and passes through zero to reverse. A scroll the
     * story didn't make (the scrollbar, a link) is followed with a glide
     * @param {Number} now ms (rAF time)
     * @param {Number} dt seconds since the last frame
     */
    advance(now, dt) {
      const last = this.chapters.length - 1;
      if (this.seekAnim) {
        const { from, to, start, duration } = this.seekAnim;
        const k = clamp((now - start) / (duration * 1000));
        const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
        this.position = from + (to - from) * e;
        if (k >= 1) {
          this.seekAnim = null;
          this.settle();
        }
        return;
      }
      if (this.follow) {
        const delta = this.target - this.position;
        if (Math.abs(delta) < 0.0005) {
          this.position = this.target;
          this.follow = false;
          this.setPlaying(false);
        } else {
          this.position += delta * (1 - Math.exp(-8 * dt));
        }
        return;
      }
      // What the reader asks for: a direction while their input lasts (Autoplay: forward)
      let wanted = 0;
      if (this.autoplaying) wanted = 1;
      else if (now - (this.inputAt || 0) < (this.holdMs || 0)) wanted = this.inputDir;
      if (!this.dir && wanted) this.dir = wanted;
      const rampIn = wanted !== 0 && wanted === this.dir;
      this.ramp = rampIn
        ? Math.min(1, (this.ramp || 0) + dt / RAMP.in)
        : Math.max(0, (this.ramp || 0) - dt / RAMP.out);
      if (this.ramp === 0) {
        this.rate = 0;
        // Stopped: reverse if asked, else rest here
        if (this.dir && !wanted) {
          this.dir = 0;
          this.settle();
        } else if (wanted) {
          this.dir = wanted;
        }
        return;
      }
      const speed = (this.autoplaying ? 1 : PLAY_SPEED) * this.smooth(this.ramp);
      // Each part of the story has its own pace (a show, a camera move, the reveal): ease from
      // one to the next so the speed never jumps at a boundary
      const rate = this.rateAt(this.position, this.dir);
      this.rate = this.rate ? this.rate + (rate - this.rate) * (1 - Math.exp(-dt / 0.3)) : rate;
      const next = this.position + this.dir * speed * this.rate * dt;
      this.position = clamp(next, 0, last);
      this.setPlaying(true);
      // The ends of the story: stop there (Autoplay is done at the final hero)
      if ((this.dir > 0 && this.position >= last) || (this.dir < 0 && this.position <= 0)) {
        this.ramp = 0;
        this.dir = 0;
        this.autoplaying = false;
        this.inputAt = 0;
        this.settle();
      }
    },
    /**
     * Playback stopped: the page's scroll catches up with the story, once (the scrollbar and the
     * browser's back/forward stay true; nothing scrolls while playing)
     */
    settle() {
      this.target = this.position;
      this.expectedY = null;
      if (this.storyTop !== undefined) {
        const i = Math.max(0, Math.min(Math.floor(this.position), this.lengths.length - 1));
        const y = this.starts[i] + clamp(this.position - i) * this.lengths[i];
        this.expectedY = Math.round(this.storyTop + y * (window.innerHeight / 100));
        window.scrollTo(0, this.expectedY);
      }
      this.setPlaying(false);
    },
    /**
     * The scroll cue and the copy know whether the story is moving (only written on change: the
     * template doesn't re-render every frame)
     * @param {Boolean} state playing
     */
    setPlaying(state) {
      if (this.playing !== state) this.playing = state;
    },
    /**
     * Whether an input in this direction plays the story (else the page scrolls as usual: past
     * the final hero, above the top, or the page under the story)
     * @param {Number} dir 1 or -1
     * @returns {Boolean}
     */
    captures(dir) {
      if (!this.ready || this.still || this.fallback || this.storyTop === undefined) return false;
      const last = this.chapters.length - 1;
      const y = window.scrollY;
      const end = this.storyTop + this.starts[last] * (window.innerHeight / 100);
      if (y < this.storyTop - 2 || y > end + 2) return false;
      if (dir > 0) return this.position < last - 0.001 || this.dir < 0;
      return this.position > 0.001 || this.dir > 0;
    },
    /**
     * The reader asked to play in a direction
     * @param {Number} dir 1 or -1
     * @param {Number} hold ms the input keeps playing without a new event
     */
    press(dir, hold) {
      this.stopGlide();
      this.seekAnim = null;
      this.follow = false;
      this.inputDir = dir;
      this.inputAt = performance.now();
      this.holdMs = hold;
      this.updateLoop();
    },
    /**
     * Wheel: plays the story while the wheel turns. Momentum (a run of weakening events after a
     * trackpad flick) doesn't keep it playing
     * @param {WheelEvent} e wheel event
     */
    onWheel(e) {
      const dir = Math.sign(e.deltaY);
      if (!dir || e.ctrlKey || !this.captures(dir)) return;
      e.preventDefault();
      const at = e.timeStamp || performance.now();
      const mag = Math.abs(e.deltaY);
      const fresh = at - (this.wheelAt || -1e9) > 120 || dir !== this.wheelDir;
      // A new flick inside a gesture: much stronger than the event before (momentum only fades)
      const flick = mag > (this.wheelMag || 0) * 1.6 && mag >= 10;
      this.decay = !fresh && mag < (this.wheelMag || 0) ? (this.decay || 0) + 1 : 0;
      if (fresh || flick) this.momentum = false;
      // Three weakening events in a row: the rest of the gesture is momentum, even its flat tail
      if (this.decay >= 3) this.momentum = true;
      this.wheelAt = at;
      this.wheelDir = dir;
      this.wheelMag = mag;
      if (this.momentum) return;
      this.press(dir, HOLD.wheel);
    },
    /**
     * Touch: where the finger is
     * @param {TouchEvent} e touch event
     */
    onTouchStart(e) {
      this.touchY = e.touches[0].clientY;
    },
    /**
     * Touch: plays while the finger moves (up: forward), never flings
     * @param {TouchEvent} e touch event
     */
    onTouchMove(e) {
      if (this.touchY == null) return;
      const y = e.touches[0].clientY;
      const dy = this.touchY - y;
      const dir = Math.sign(dy);
      if (!dir || !this.captures(dir)) return;
      e.preventDefault();
      if (Math.abs(dy) < 3) return;
      this.touchY = y;
      this.press(dir, HOLD.touch);
    },
    /**
     * Touch: the finger lifted, playback eases out
     */
    onTouchEnd() {
      this.touchY = null;
      this.inputAt = 0;
    },
    /**
     * Keys: arrows, Page Up/Down and Space play while held (a tap plays a moment)
     * @param {KeyboardEvent} e key event
     */
    onKeyDown(e) {
      const field = e.target && (e.target.isContentEditable
        || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName));
      if (field || e.altKey || e.ctrlKey || e.metaKey) return;
      const keys = {
        ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1, ' ': e.shiftKey ? -1 : 1,
      };
      const dir = keys[e.key];
      if (!dir || !this.captures(dir)) return;
      e.preventDefault();
      this.keyDir = dir;
      this.press(dir, HOLD.key);
    },
    /**
     * Keys: released, playback eases out
     * @param {KeyboardEvent} e key event
     */
    onKeyUp(e) {
      if (!this.keyDir) return;
      const keys = ['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp', ' '];
      if (!keys.includes(e.key)) return;
      this.keyDir = 0;
      // A tap still plays a moment
      this.holdMs = Math.min(this.holdMs, performance.now() - this.inputAt + 200);
    },
    /**
     * Story position for a page scroll offset
     * @param {Number} scrollY page scroll (px)
     * @returns {Number} position
     */
    positionAt(scrollY) {
      const vh = window.innerHeight / 100;
      const y = clamp((scrollY - this.storyTop) / vh, 0, this.totalLength);
      let i = 0;
      while (i < this.lengths.length - 1 && y >= this.starts[i + 1]) i += 1;
      return i + clamp((y - this.starts[i]) / this.lengths[i]);
    },
    /**
     * Scrolls the page to a story position
     * @param {Number} position story position
     */
    holdScroll(position) {
      const i = Math.max(0, Math.min(Math.floor(position), this.lengths.length - 1));
      const y = this.starts[i] + clamp(position - i) * this.lengths[i];
      window.scrollTo(0, this.storyTop + y * (window.innerHeight / 100));
    },
    /**
     * Where the story starts on the page (px), read once per layout change: the scroll handler
     * never measures the page
     */
    measure() {
      const { story } = this.$refs;
      if (story) this.storyTop = story.getBoundingClientRect().top + window.scrollY;
    },
    /**
     * Stops the show
     */
    stopLoop() {
      if (this.frameId) cancelAnimationFrame(this.frameId);
      this.frameId = null;
    },
    /**
     * Draws the liquid cover for the current reveal
     * @param {Number} t seconds
     */
    drawReveal(t) {
      if (!this.reveal) return;
      const open = this.outro > 0 ? 1 - this.smooth(this.outro) : this.smooth(this.morph);
      this.reveal.render(open, t);
    },
    /**
     * Copies the show's DMX frame into the widgets of the chapter in view (about 20 times a second)
     */
    sync() {
      const { frame, state } = cached.stage;
      switch (this.chapterId) {
        case 'channels':
          this.channels.forEach((channel, i) => { channel.value = frame[i]; });
          break;
        case 'control': {
          const rgb = colorOf(frame, 0, [0, 0, 0]);
          if (rgb.some((v, i) => v !== this.color[i])) this.color = rgb;
          // The pan/tilt widget watches its prop object, not its fields: hand it a new one
          const [, , , pan, panFine, tilt, tiltFine] = frame;
          this.panTilt = {
            pan, panFine, tilt, tiltFine,
          };
          break;
        }
        case 'cues':
        case 'chase':
          this.group.cuePool.cues.forEach((cue) => {
            const playing = cue.id === state.cueId;
            cue.state = playing && this.chapterId === 'cues';
            cue.chaseActive = playing && this.chapterId === 'chase';
            cue.time = playing ? state.cueTime * 1000 : 0;
          });
          this.chase.elapsedPerc = state.chase;
          break;
        case 'output':
          for (let i = 0; i < this.universe.length; i++) this.universe[i] = frame[i];
          break;
        default:
          break;
      }
      if (this.chapterId === 'cues' || this.chapterId === 'chase') ManualTicker.bump();
    },
    /**
     * The page scrolled. Our own catch-up scroll is ignored; any other scroll (the scrollbar, a
     * link, the page under the story) moves the story to match, with a glide
     */
    onScroll() {
      if (!this.$refs.story) return;
      if (this.storyTop === undefined) this.measure();
      if (this.expectedY != null && Math.abs(window.scrollY - this.expectedY) < 2) return;
      this.expectedY = null;
      this.target = this.positionAt(window.scrollY);
      if (!this.ready || this.still) {
        this.position = this.target;
        if (!this.ready && this.morph < 1) this.drawReveal(performance.now() / 1000);
        return;
      }
      if (this.dir || this.seekAnim) return;
      this.follow = true;
      this.setPlaying(true);
      this.updateLoop();
    },
    /**
     * Pointer over the page: the stage's camera tilts a little towards it
     * @param {PointerEvent} e pointer event
     */
    onPointer(e) {
      if (!cached || !this.ready) return;
      cached.stage.setPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        1 - (e.clientY / window.innerHeight) * 2,
      );
    },
    /**
     * Stops Autoplay (the reader's own input takes over)
     */
    stopGlide() {
      this.autoplaying = false;
    },
    /**
     * Autoplay, one toggle for the whole story: plays the shows at real time, easing in, up to the
     * final hero. Again to pause (it eases out); the reader's wheel, swipes and keys also stop it
     */
    toggleAutoplay() {
      if (this.autoplaying) {
        this.stopGlide();
        return;
      }
      this.seekAnim = null;
      this.follow = false;
      this.autoplaying = true;
      this.updateLoop();
    },
    /**
     * Glides to a story position (the rail, Next, Replay): eased in and out, timed by distance
     * @param {Number} to story position
     */
    seek(to) {
      const target = clamp(to, 0, this.chapters.length - 1);
      this.follow = false;
      this.dir = 0;
      this.ramp = 0;
      this.inputAt = 0;
      const distance = Math.abs(target - this.position);
      if (distance < 0.001) return;
      this.seekAnim = {
        from: this.position,
        to: target,
        start: performance.now(),
        duration: Math.min(0.9 + 0.3 * distance, 2.2),
      };
      this.setPlaying(true);
      this.updateLoop();
    },
    /**
     * Skips to chapter i; Autoplay, if on, carries on from there
     * @param {Number} i chapter index
     */
    next(i) {
      const playing = this.autoplaying;
      this.seek(Math.min(i, this.chapters.length - 1));
      this.autoplaying = playing;
    },
    /**
     * Back to the first hero
     */
    backToTop() {
      this.stopGlide();
      this.seek(0);
    },
    /**
     * Keeps the renderer, the reveal and the panels at the screen size
     */
    onResize() {
      this.narrow = window.innerWidth < 768;
      this.measure();
      if (this.reveal) {
        this.reveal.resize();
        this.drawReveal(performance.now() / 1000);
      }
      if (cached && this.ready) {
        this.panels.forEach((panel) => {
          cached.stage.setPanelLayout(this.panelElements[panel.id], this.panelLayout(panel));
        });
        cached.stage.resize();
      }
    },
    /**
     * To a chapter (the rail, the scroll cue)
     * @param {Number} i chapter index
     */
    goTo(i) {
      this.stopGlide();
      this.seek(i);
    },
  },
};
</script>

<style scoped>
.story {
  position: relative;
  /* Studio's surfaces, kept here before panels redefine them as translucent */
  --story-light: var(--primary-light);
  --story-light-alt: var(--primary-light-alt);
  --story-dark: var(--primary-dark);
  --story-dark-alt: var(--primary-dark-alt);
  background: var(--primary-dark);
}

.story_sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

/* ── Stage, liquid reveal and the CSS3D layer ── */
.story_stage,
.story_reveal,
.story_css {
  position: absolute;
  inset: 48px 0 0;
  width: 100%;
  height: calc(100% - 48px);
}

.story_stage {
  will-change: transform;
}

.story_stage :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.story_reveal {
  pointer-events: none;
}

.story_reveal.done {
  visibility: hidden;
}

.story_css {
  pointer-events: none;
}

/* Panels are a picture of Studio, not controls */
.story_css :deep(.story_anchor) {
  pointer-events: none;
}

/* Flat blur behind each panel, clipped to its outline by the stage every frame */
.story_blurs {
  position: absolute;
  inset: 48px 0 0;
  pointer-events: none;
}

.story_blur {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(14px) saturate(1.2);
  clip-path: polygon(0 0, 0 0, 0 0);
}

/* ── 2D hero ── */
.story_hero {
  position: absolute;
  inset: 48px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px 72px;
  text-align: center;
  will-change: transform, opacity, filter;
}

.story_logo {
  width: clamp(260px, 30vw, 440px);
  height: auto;
}

.story_hero_title {
  max-width: 1100px;
  margin: 48px 0 0;
  font-family: Roboto, Roboto-Bold, sans-serif;
  font-weight: 700;
  font-size: clamp(40px, 6.4vw, 96px);
  line-height: 1;
  letter-spacing: -0.04em;
  color: #fff;
}

.story_hero_sub {
  display: block;
  max-width: 620px;
  margin: 28px auto 0;
  font-family: Roboto, Roboto-Regular, sans-serif;
  font-size: clamp(17px, 1.5vw, 20px);
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.7);
}

.story_hero .story_actions {
  justify-content: center;
  margin-top: 40px;
}

.story_hint {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: none;
  background: transparent;
  color: #fff;
  transform: translateX(-50%);
  cursor: pointer;
  transition: opacity 0.5s ease;
}

.story_hint_label {
  font-family: Roboto-Bold, sans-serif;
  font-size: 13px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.story_hint_line {
  position: relative;
  width: 2px;
  height: 56px;
  overflow: hidden;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.story_hint_line::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: 40%;
  background: #fff;
  transform: translateY(-100%);
  animation: hint 1.8s ease-in-out infinite;
  animation-play-state: var(--hint-run, running);
}

.story_hint_chevron {
  width: 16px;
  height: 10px;
  margin-top: -4px;
  fill: none;
  stroke: #fff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: hint-chevron 1.8s ease-in-out infinite;
  animation-play-state: var(--hint-run, running);
}

@keyframes hint-chevron {
  0%, 100% { transform: translateY(0); opacity: 0.6; }
  50% { transform: translateY(4px); opacity: 1; }
}

/* Transform only: the line runs on the compositor, without a layout per frame */
@keyframes hint {
  to { transform: translateY(250%); }
}

/* ── Buttons: solid, in Studio's round shape ── */
.story_actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.story_btn {
  padding: 0 24px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  font-family: Roboto-Medium, sans-serif;
  font-size: 13px;
  line-height: 40px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
  color: #fff;
  transition: background-color 0.15s;
}

.story_btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.story_btn.primary {
  background: #fff;
  color: var(--story-dark);
}

.story_replay {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 6px 8px;
  border: none;
  background: transparent;
  font-family: Roboto-Medium, sans-serif;
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  opacity: 0.65;
  cursor: pointer;
  transition: opacity 0.15s;
}

.story_replay:hover {
  opacity: 1;
}

.story_replay svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.story_outro {
  z-index: 4;
}

.story_btn.primary:hover {
  background: rgba(255, 255, 255, 0.85);
}

/* Autoplay: a small round Studio button under the description */
.story_play {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 0 16px 0 12px;
  border: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  font-family: Roboto-Medium, sans-serif;
  font-size: 12px;
  line-height: 32px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s;
}

.story_controls {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}

.story_controls .story_play {
  margin-top: 0;
}

.story_play:hover {
  background: rgba(255, 255, 255, 0.18);
}

.story_play svg {
  width: 12px;
  height: 12px;
  fill: var(--chapter-color);
}

/* Next: label first, a chevron after */
.story_next {
  padding: 0 12px 0 16px;
}

.story_next svg {
  fill: none;
  stroke: var(--chapter-color);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.story_play.playing {
  background: rgba(255, 255, 255, 0.16);
}

/* ── Chapter copy ── */
.story_copy {
  position: absolute;
  z-index: 2;
  top: calc(48px + 14vh);
  width: min(440px, calc(100vw - 48px));
  will-change: transform, opacity;
}

/* A frosted, darkened pool behind the copy, feathered to nothing: no box, and beams passing
   behind the text are softened */
.story_copy::before {
  content: '';
  position: absolute;
  inset: -96px -140px;
  z-index: -1;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  -webkit-mask-image: radial-gradient(closest-side, #000 55%, transparent);
  mask-image: radial-gradient(closest-side, #000 55%, transparent);
  pointer-events: none;
}

.story_heading,
.story_text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.story_copy.pos_left {
  left: clamp(24px, 6vw, 112px);
}

.story_copy.pos_right {
  right: clamp(96px, 10vw, 180px);
}

.story_copy.pos_top {
  top: 68px;
  left: 20px;
  width: calc(100vw - 40px);
}

/* Step progress: a thin bar filling as the chapter's show plays */
.story_progress {
  display: block;
  width: 120px;
  height: 2px;
  margin: 0 0 18px;
  overflow: hidden;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.15);
}

.story_progress > span {
  display: block;
  height: 100%;
  background: var(--chapter-color);
  transform-origin: left;
}

.story_count {
  display: block;
  margin: 0 0 24px;
  font-family: Roboto-Medium, sans-serif;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: #fff;
}

.story_count span {
  opacity: 0.4;
}

.story_kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-family: Roboto-Bold, sans-serif;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--chapter-color);
}

.story_dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--chapter-color);
}

.story_heading {
  margin: 0 0 18px;
  font-family: Roboto, Roboto-Bold, sans-serif;
  font-weight: 700;
  font-size: clamp(30px, 3.4vw, 48px);
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #fff;
}

.story_text {
  display: block;
  margin: 0;
  font-family: Roboto, Roboto-Regular, sans-serif;
  font-size: 17px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.76);
}

.story_copy .story_actions {
  margin-top: 16px;
}

/* ── Panels: Studio's widgets in the scene, translucent ── */
.story_panels {
  display: none;
}

.story_panel {
  /* Studio's own tokens, made translucent so the scene shows through every surface */
  --primary-light: color-mix(in srgb, var(--story-light) 58%, transparent);
  --primary-light-alt: color-mix(in srgb, var(--story-light-alt) 58%, transparent);
  --primary-dark: color-mix(in srgb, var(--story-dark) 45%, transparent);
  --primary-dark-alt: color-mix(in srgb, var(--story-dark-alt) 45%, transparent);
  display: flex;
  overflow: hidden;
  border-radius: 2px;
  background: color-mix(in srgb, var(--story-light) 25%, transparent);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.story_panel > :deep(.widget) {
  flex: 1 1 auto;
  border-right: none;
}

/* ── Progress rail ── */
.story_rail {
  position: absolute;
  top: 50%;
  right: 28px;
  width: 2px;
  height: 200px;
  transform: translateY(-50%);
}

.story_rail_track {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.12);
}

.story_rail_fill {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  transform-origin: top;
}

.story_rail_item {
  position: absolute;
  right: -5px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: none;
  background: transparent;
  transform: translateY(-50%);
  cursor: pointer;
}

.story_rail_dot {
  width: 12px;
  height: 12px;
  border: 3px solid var(--story-dark);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  transition: background-color 0.2s, transform 0.2s;
}

.story_rail_item.done .story_rail_dot {
  background: rgba(255, 255, 255, 0.7);
}

.story_rail_item.active .story_rail_dot {
  background: var(--chapter-color);
  transform: scale(1.25);
}

.story_rail_label {
  font-family: Roboto-Medium, sans-serif;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  color: #fff;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 0.2s, transform 0.2s;
}

.story_rail_item.active .story_rail_label,
.story_rail_item:hover .story_rail_label {
  opacity: 0.8;
  transform: none;
}

.fallback .story_stage,
.fallback .story_reveal {
  display: none;
}

@media (max-width: 959px) {
  .story_rail {
    display: none;
  }

  .story_copy.pos_right {
    right: 24px;
  }
}

@media (max-width: 767px) {
  .story_text {
    font-size: 15px;
  }

  .story_copy::before {
    inset: -80px -60px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story_hint_line::after,
  .story_hint_chevron {
    animation: none;
  }
}
</style>
