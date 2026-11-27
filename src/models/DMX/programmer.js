import { markRaw, reactive } from '../utils/reactivity';

const MAX_DMX_VALUE = 255;

/**
 * The programmer: values set by hand in the universe view. They go out instead of what playback
 * writes (Universe.packFrame), on every group, until cleared; never saved. Writes reach it the way
 * a playing cue's reach its claim: `Programmer.run()` sets `writing`, and `Fixture.setChannel`
 * then stores into `channel.programmed` instead of the channel's value.
 *
 * @module models/DMX/programmer
 */
const Programmer = {
  /**
   * Set while `run()` writes: Fixture.setChannel stores into the programmer
   *
   * @type {Boolean}
   */
  writing: false,

  /**
   * What the UI reads: the ids of the fixtures holding programmer values, and of those with
   * parked channels (kept by Fixture.park / unpark)
   *
   * @type {{held: Number[], parked: Number[]}}
   */
  state: reactive({ held: [], parked: [] }),

  // id → fixture (as the UI handed it), to clear them
  fixtures: markRaw(new Map()),

  /**
   * Writes into the programmer: `write(fixture)` for each fixture, its channel writes
   * (setQuickAccessor, setColor, setPanTilt, setChannel) going to the programmer
   *
   * @public
   * @param {Array<Fixture>} fixtures
   * @param {Function} write (fixture, index) => void
   */
  run(fixtures, write) {
    this.writing = true;
    try {
      fixtures.forEach((fixture, index) => {
        write(fixture, index);
        this.track(fixture);
      });
    } finally {
      this.writing = false;
    }
  },

  /**
   * Stores a value in a channel's programmer slot (the fine channel takes the fraction)
   *
   * @public
   * @param {Fixture} fixture
   * @param {Channel} channel
   * @param {Number} value DMX 0-255, fractions for 16-bit channels
   */
  program(fixture, channel, value) {
    const clamped = Math.min(Math.max(Number(value) || 0, 0), MAX_DMX_VALUE);
    // The fine channel through the fixture's own list too, so the views follow it
    const [fineChannel] = channel.fineChannels;
    const fine = fineChannel ? fixture.channels[fineChannel.id - 1] : null;
    if (fine) {
      fine.programmed = Math.round((clamped % 1) * MAX_DMX_VALUE);
      channel.programmed = Math.floor(clamped);
    } else {
      channel.programmed = Math.round(clamped);
    }
  },

  /**
   * Empties the programmer, or only the given fixtures' values: they follow playback again at once
   *
   * @public
   * @param {Array<Fixture>} [fixtures] the fixtures to clear (all by default)
   */
  clear(fixtures = null) {
    const list = fixtures || [...this.fixtures.values()];
    list.forEach((fixture) => {
      fixture.channels.forEach((channel) => { channel.programmed = null; });
      this.track(fixture);
    });
  },

  /**
   * Clears one channel (and its fine channel) of a fixture from the programmer
   *
   * @public
   * @param {Fixture} fixture
   * @param {Channel} channel one of the fixture's channels
   */
  clearChannel(fixture, channel) {
    const own = fixture.channels[fixture.channels.indexOf(channel)];
    if (!own) return;
    own.programmed = null;
    own.fineChannels.forEach((fine) => { fixture.channels[fine.id - 1].programmed = null; });
    this.track(fixture);
  },

  /**
   * Forgets a fixture (deleted, or the show it belonged to cleared) without writing to it
   *
   * @public
   * @param {Fixture} fixture
   */
  drop(fixture) {
    this.fixtures.delete(fixture.id);
    this.state.held = this.state.held.filter((id) => id !== fixture.id);
    this.state.parked = this.state.parked.filter((id) => id !== fixture.id);
  },

  /**
   * Forgets every fixture (a show is cleared or loaded)
   *
   * @public
   */
  reset() {
    this.fixtures.clear();
    this.state.held = [];
    this.state.parked = [];
  },

  /**
   * Keeps the parked list in step with a fixture's channels
   *
   * @public
   * @param {Fixture} fixture
   */
  trackParked(fixture) {
    const parks = fixture.parkedCount > 0;
    const listed = this.state.parked.includes(fixture.id);
    if (parks && !listed) this.state.parked = [...this.state.parked, fixture.id];
    if (!parks && listed) this.state.parked = this.state.parked.filter((id) => id !== fixture.id);
  },

  /**
   * Whether a fixture holds programmer values
   *
   * @public
   * @param {Fixture} fixture
   * @returns {Boolean}
   */
  holds(fixture) {
    return this.state.held.includes(fixture.id);
  },

  /**
   * Keeps the held list in step with a fixture's channels
   *
   * @private
   * @param {Fixture} fixture
   */
  track(fixture) {
    const holds = fixture.channels.some((channel) => channel.programmed !== null);
    const listed = this.state.held.includes(fixture.id);
    if (holds) {
      this.fixtures.set(fixture.id, fixture);
      if (!listed) this.state.held = [...this.state.held, fixture.id];
    } else {
      this.fixtures.delete(fixture.id);
      if (listed) this.state.held = this.state.held.filter((id) => id !== fixture.id);
    }
  },
};

export default Programmer;
