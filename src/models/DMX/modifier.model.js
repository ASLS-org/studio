const MODIFIER_STATES = {
  DISABLED: true,
  ENABLED: false,
};

/**
 * @todo remove this file
 *
 * @class Modifier
 */
class Modifier {
  constructor(type) {
    this.type = type;
    this._value = 0;
    this.state = MODIFIER_STATES.DISABLED;
    this.modifiedInstances = [];
  }

  add(fixture, channelIndex) {
    this.modifiedInstances.push({
      fixture,
      channelId: channelIndex,
    });
  }

  set value(value) {
    this._value = value;
    this.modifiedInstances.forEach((instance) => {
      instance.fixture.setChannel(instance.channelId, this.value);
    });
  }

  get value() {
    return this._value;
  }

  get state() {
    return this._state;
  }

  set state(state) {
    this._state = state;
  }
}

export default Modifier;
