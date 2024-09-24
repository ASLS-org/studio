import WebShowSclient from '@/plugins/webshow';

/**
 * @class OutputPool
 * @extends {Proxify}
 * @classdesc Pool of output instances
 */
class OutputPool {
  constructor() {
    this.outputs = [];
    this.selected = [0];
  }

  /**
   * Ouputs exportable show data chunk
   *
   * @readonly
   * @type {Object}
   */
  get showData() {
    return this.outputs.map((output) => ({
      id: output.id,
      name: output.name,
      color: output.color,
      remote: output.remote,
      port: output.port,
      universe: output.universe.id,
    }));
  }

  /**
   * Pool's listable data
   *
   * @todo remove this ? Am I even using it ?
   * @readonly
   * @type {Array}
   */
  get listable() {
    return this.outputs.map((output) => ({
      id: output.id,
      name: `${output.name} - ${output.remote}`,
      color: output.color,
      icon: 'patch',
      action: {
        label: 'connect',
        action: output.connect,
      },
    }));
  }

  /**
   * Returns output instance from provided ID
   *
   * @public
   * @param {Number} id
   * @return {Object} Output instance
   */
  getFromId(id) {
    const output = this.outputs.find((u) => u.id === Number(id));
    if (output) {
      return output;
    }
    throw new Error('Cannot find output in pool');
  }

  /**
   * Creates a new output instance from provided configuraion data and pushes it to the pool
   *
   * @public
   * @param {Object} outputData output configuration object
   * @return {Object} Output instance
   * @see Output
   */
  addRaw(outputData = {}) {
    try {
      const output = new WebShowSclient(
        outputData.remote,
        outputData.port,
        outputData.universe,
        outputData.name,
      );
      output.id = this.genOutputId();
      output._animationId = null;
      this.outputs.push(output);
      return output;
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * Removes output from pool
   *
   * @public
   * @param {Object} output output instance handle
   */
  delete(output) {
    const outputIndex = this.outputs.findIndex((item) => item.id === output.id);
    if (outputIndex > -1) {
      this.outputs[outputIndex].handleClosure();
      this.outputs.splice(outputIndex, 1);
    } else {
      throw new Error('Could not find output in output pool');
    }
  }

  /**
   * Clears all output instances from pool
   *
   * @public
   */
  clearAll() {
    for (let i = this.outputs.length - 1; i >= 0; i--) {
      this.delete(this.outputs[i]);
    }
  }

  /**
   * Generates output unique ID
   *
   * @public
   * @returns {Number} The output's unique ID
   */
  genOutputId() {
    return this.outputs.reduce(
      (prev, current) => (
        (prev && prev.id > current.id)
          ? prev.id
          : current.id
      ),
      -1,
    ) + 1;
  }
}

export default OutputPool;
