import { APP_OWNER } from '@/views/view.state';

/**
 * A computed popup state bound to the view state: use it as the popup's `v-model`. Opening it
 * puts the named popup on top of the open ones; panel popups (owner = a panel) close when the
 * view changes panel.
 *
 * @param {String} name popup name, unique in the app (e.g. 'universe.patch')
 * @param {String} [owner='app'] the panel it belongs to ('universe', 'group', 'chase'), or 'app'
 * @param {Boolean} [keep=false] app popups only: stays open across a show load
 * @returns {Object} computed definition ({ get, set })
 */
export default function modal(name, owner = APP_OWNER, keep = false) {
  return {
    get() {
      return this.$view ? this.$view.isOpen(name) : false;
    },
    set(state) {
      if (!this.$view) return;
      if (state) this.$view.openModal(name, owner, keep);
      else this.$view.closeModal(name);
    },
  };
}
