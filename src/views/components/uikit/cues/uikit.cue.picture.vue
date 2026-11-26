<template>
  <span
    class="uikit_cue_picture"
    :class="[picture ? `picture_${picture.kind}` : 'empty', { small }]"
  >
    <template v-if="picture">
      <span
        v-if="picture.kind === 'swatch'"
        class="picture_fill"
        :style="{ background: picture.background }"
      />
      <span
        v-else-if="picture.kind === 'level'"
        class="picture_fill"
        :style="{ height: `${Math.round(picture.level * 100)}%` }"
      />
      <template v-else-if="picture.kind === 'dots'">
        <span
          v-for="(dot, i) in picture.dots"
          :key="i"
          class="picture_dot"
          :style="{ left: `${dot.x * 100}%`, bottom: `${dot.y * 100}%` }"
        />
      </template>
      <svg
        v-else
        class="picture_line"
        :class="{ filled: picture.kind === 'cone' }"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <!-- Several waves layered: each a little fainter than the one before -->
        <path
          v-for="(d, i) in picture.paths || [picture.path]"
          :key="i"
          :d="d"
          :style="i ? { opacity: Math.max(1 - i * fade, minOpacity) } : null"
        />
      </svg>
    </template>
  </span>
</template>

<script>
/**
 * @component CuePicture What a cue sets, drawn small: its colours (a swatch or a gradient), its
 * intensity level, an aim over centre lines, a beam cone as wide as its zoom, an effect's waves
 * (layered, each fainter) or a pan/tilt path. Dashed and empty when the cue sets nothing yet.
 * Plain elements and inline SVG: cheap enough for every cue row
 * @namespace uikit/cues
 * @story Colour {"picture":{"kind":"swatch","background":"rgb(226,93,106)"}}
 * @story Level {"picture":{"kind":"level","level":0.75}}
 * @story Aim {"picture":{"kind":"dots","dots":[{"x":0.3,"y":0.6}]}}
 * @story Waves {"picture":{"kind":"wave","paths":["M0,50 L50,0 L100,50","M0,100 L50,50 L100,100"]}}
 * @story Empty {"picture":null}
 * @story Small {"picture":{"kind":"swatch","background":"rgb(90,113,211)"},"small":true}
 */
export default {
  name: 'UkCuePicture',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * What to draw (views/utils/cue.previews.js): `{ kind: 'swatch'|'level'|'dots'|'cone'|'wave'|
     * 'path', background, level, dots, path, paths }` (`paths`: several lines, layered), null when
     * the cue sets nothing
     */
    picture: {
      type: Object,
      default: null,
    },
    /** Drawn at icon size (14 px) instead of 24 px, for thin bars */
    small: Boolean,
  },
  data() {
    return {
      /** Opacity each layered line loses after the first */
      fade: 0.25,
      /** The faintest a layered line gets */
      minOpacity: 0.35,
    };
  },
};
</script>

<style scoped>
.uikit_cue_picture {
  position: relative;
  flex-shrink: 0;
  width: var(--icon-lg);
  height: var(--icon-lg);
  border-radius: var(--radius-sm);
  background: var(--primary-dark);
  overflow: hidden;
}
.uikit_cue_picture.small {
  width: var(--icon-sm);
  height: var(--icon-sm);
}
.uikit_cue_picture.empty {
  border: var(--border-width) dashed var(--secondary-light);
  background: transparent;
}
/* Position: the centre lines the aims are read against */
.picture_dots {
  background:
    linear-gradient(var(--secondary-dark), var(--secondary-dark)) center / 100% var(--border-width)
      no-repeat,
    linear-gradient(var(--secondary-dark), var(--secondary-dark)) center / var(--border-width) 100%
      no-repeat,
    var(--primary-dark);
}
.picture_fill {
  position: absolute;
  inset: 0;
}
.picture_level .picture_fill {
  top: auto;
  background: var(--secondary-lighter);
}
.picture_dot {
  position: absolute;
  width: var(--space-2);
  height: var(--space-2);
  margin: 0 0 calc(var(--space-2) / -2) calc(var(--space-2) / -2);
  border-radius: var(--radius-round);
  background: var(--secondary-lighter);
}
.picture_line {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.picture_line path {
  fill: none;
  stroke: var(--secondary-lighter);
  stroke-width: 1.5px;
  vector-effect: non-scaling-stroke;
}
.picture_line.filled path {
  fill: var(--secondary-light);
}
</style>
