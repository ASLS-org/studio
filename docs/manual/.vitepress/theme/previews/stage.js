/*
 * What the floating visualizer card needs to know about the page's live previews: how many of
 * them drive the rig (the card only shows on pages that have one), and which one is running, so
 * the card can float next to it. Written by LivePreview, read by FloatingVisualizer.
 */
import { reactive } from 'vue';

/**
 * @type {{ count: Number, frame: ?HTMLElement, title: String, demo: Boolean }}
 * - count: stage previews on the page (`stage: true` presets)
 * - frame: the running stage preview's frame, or null
 * - title: its title (the component it shows)
 * - demo: whether a scripted demo plays in it
 */
const stage = reactive({
  count: 0,
  frame: null,
  title: '',
  demo: false,
});

export default stage;
