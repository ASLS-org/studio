/**
 * Makes a component a keyboard block: while the focus is inside its element (`keysElement()`,
 * else its root), `handleKeys(e)` gets the keys no popup or field took. `handleKeys` returns
 * true when it handled the key. See views/keyboard.js.
 */
export default {
  mounted() {
    if (!this.$keyboard || !this.handleKeys) return;
    const el = () => (this.keysElement ? this.keysElement() : this.$el);
    this.removeKeys = this.$keyboard.addBlock(el, (e) => this.handleKeys(e));
  },
  beforeUnmount() {
    if (this.removeKeys) this.removeKeys();
  },
};
