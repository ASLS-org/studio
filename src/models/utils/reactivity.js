/**
 * The models' only contact point with Vue reactivity.
 *
 * The UI exposes the show through `reactive()`, so model methods called from components run
 * on reactive proxies. Playback (Live callbacks) must run on raw objects so per-tick writes
 * trigger no Vue work; widgets read live values through the UI ticker instead. When the engine
 * moves to a Worker, this module is what goes away.
 */
export { markRaw, toRaw } from 'vue';
