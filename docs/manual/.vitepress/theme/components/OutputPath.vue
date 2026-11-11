<template>
  <StudioFrame
    :caption="caption"
    :padding="0"
  >
    <div
      class="output_path"
      :class="{ running }"
    >
      <div class="output_path_controls">
        <h3>Studio runs</h3>
        <div class="output_path_options">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            :class="{ active: mode === option.value }"
            @click="mode = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <p>{{ current.text }}</p>
      </div>

      <div class="output_path_flow">
        <!-- The computer: Studio, and the gateway (inside the app, or beside the browser) -->
        <div class="output_path_computer">
          <span class="output_path_tag">Your computer</span>
          <div
            class="output_path_app"
            :class="{ bundled: mode === 'desktop' }"
          >
            <div class="output_path_box studio">
              <b>Studio</b>
              <small>{{ mode === 'desktop' ? 'desktop app' : 'browser tab' }}</small>
            </div>
            <div class="output_path_link short">
              <span class="output_path_track">
                <span class="output_path_dot" />
              </span>
            </div>
            <div class="output_path_box gateway">
              <b>Gateway</b>
              <small>{{ current.gateway }}</small>
            </div>
          </div>
        </div>
        <div class="output_path_link">
          <span class="output_path_label">{{ current.wire }}</span>
          <span class="output_path_track">
            <span class="output_path_dot" />
          </span>
        </div>
        <div class="output_path_box device">
          <b>{{ current.device }}</b>
          <small>{{ current.deviceNote }}</small>
        </div>
        <div class="output_path_link">
          <span class="output_path_label">DMX</span>
          <span class="output_path_track">
            <span class="output_path_dot" />
          </span>
        </div>
        <div class="output_path_box lights">
          <b>Lights</b>
          <small>each at its address</small>
        </div>
      </div>
    </div>
  </StudioFrame>
</template>

<script>
/**
 * How Studio's output reaches the lights: Studio, the gateway (built into the desktop app, run
 * beside the browser version), a network node, the lights. Dots travel along the path while it
 * is on screen (still for reduced motion).
 * @example <OutputPath />
 */
export default {
  name: 'OutputPath',
  data() {
    return {
      mode: 'desktop',
      running: false,
      caption: 'Studio sends each universe to the gateway; the gateway turns it into Art-Net on '
        + 'your network, and a node turns that into DMX for the lights',
      options: [
        {
          value: 'desktop',
          label: 'Desktop app',
          gateway: 'built in, starts with the app',
          text: 'The gateway is part of the desktop app: it starts and stops with it. Connect '
            + 'Studio to it at 127.0.0.1, port 4515 (the defaults).',
          wire: 'Art-Net (network)',
          device: 'Art-Net node',
          deviceNote: 'or a light that speaks Art-Net',
        },
        {
          value: 'browser',
          label: 'In the browser',
          gateway: 'run it yourself',
          text: 'A web page can\'t talk to your network or USB devices: run the gateway on the '
            + 'same computer, then connect Studio to it at 127.0.0.1, port 4515.',
          wire: 'Art-Net (network)',
          device: 'Art-Net node',
          deviceNote: 'or a light that speaks Art-Net',
        },
      ],
    };
  },
  computed: {
    /**
     * The selected option
     * @type {Object}
     */
    current() {
      return this.options.find((o) => o.value === this.mode);
    },
  },
  mounted() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.observer = new IntersectionObserver(([entry]) => {
      this.running = entry.isIntersecting;
    });
    this.observer.observe(this.$el);
  },
  beforeUnmount() {
    if (this.observer) this.observer.disconnect();
  },
};
</script>

<style scoped>
.output_path {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1px;
  background: var(--primary-dark);
}

.output_path > * {
  background: var(--primary-light);
}

.output_path_controls {
  padding: 12px 16px;
}

.output_path_controls h3 {
  margin-bottom: 6px;
  font-family: Roboto-Bold, sans-serif;
  font-size: 12px;
  text-transform: uppercase;
}

.output_path_controls p {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--secondary-light);
}

.output_path_options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.output_path_options button {
  padding: 0 10px;
  border: none;
  border-radius: 4px;
  background: var(--primary-lighter);
  font-family: Roboto-Medium, sans-serif;
  font-size: 11px;
  line-height: 24px;
  color: var(--secondary-light);
  cursor: pointer;
}

.output_path_options button.active {
  background: var(--accent-sea-green);
  color: var(--primary-dark);
}

.output_path_flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
}

/* Vertical at every width: it reads top to bottom, from Studio to the lights */
.output_path_computer {
  position: relative;
  width: 100%;
  max-width: 340px;
  padding: 22px 10px 10px;
  border: 1px dashed var(--primary-lighter);
  border-radius: 6px;
}

.output_path_tag {
  position: absolute;
  top: 5px;
  left: 10px;
  font-family: Roboto-Medium, sans-serif;
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--secondary-light);
}

.output_path_app {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 6px;
  border: 1px solid transparent;
  border-radius: 6px;
}

.output_path_app.bundled {
  border-color: var(--accent-blue);
}

.output_path_box {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  max-width: 300px;
  padding: 8px 10px;
  border-left: 3px solid var(--box-color);
  border-radius: 4px;
  background: var(--primary-dark);
}

.output_path_app .output_path_box {
  max-width: none;
}

.output_path_box b {
  font-family: Roboto-Medium, sans-serif;
  font-weight: normal;
  font-size: 12px;
  color: var(--secondary-lighter);
}

.output_path_box small {
  font-size: 11px;
  color: var(--secondary-light);
}

.output_path_box.studio { --box-color: var(--accent-blue); }
.output_path_box.gateway { --box-color: var(--accent-violet); }
.output_path_box.device { --box-color: var(--accent-sea-green); }
.output_path_box.lights { --box-color: var(--accent-gold); }

.output_path_link {
  position: relative;
  flex: none;
  align-self: center;
  width: 2px;
  height: 36px;
  margin: 4px 0;
  background: var(--primary-lighter);
}

.output_path_link.short {
  height: 18px;
}

.output_path_label {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-family: Roboto-Medium, sans-serif;
  font-size: 10px;
  white-space: nowrap;
  color: var(--secondary-light);
}

/* A packet travelling down the link: a full-height strip, clipped to the link, whose dot sits
   at its bottom; the strip slides down (transform only, paused off screen) */
.output_path_track {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -3px;
  width: 8px;
  overflow: hidden;
}

.output_path_dot {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateY(-100%);
  animation: output-packet 1.2s linear infinite;
  animation-play-state: paused;
}

.output_path_dot::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-sea-green);
}

.output_path.running .output_path_dot {
  opacity: 1;
  animation-play-state: running;
}

@keyframes output-packet {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .output_path_track {
    display: none;
  }
}
</style>
