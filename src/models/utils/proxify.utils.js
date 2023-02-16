import {
  EventEmitter
} from 'events';

/**
 * @class ProxifySingleton
 * @extends {EventEmitter}
 * @classdesc ProxifySingleton handles undi/redo pattern by detecting changes in proxified object and queuing them into an undo/redo stack
 */
class ProxifySingleton extends EventEmitter {

  constructor() {
    if (!ProxifySingletonInstance) {
      super();
      this.stackSize = 5000;
      this.undoStack = [];
      this.redoStack = [];
      this.hash = null;
      window.addEventListener('mousedown', this.regenHash.bind(this));
      window.addEventListener('mouseup', this.regenHash.bind(this));
      ProxifySingletonInstance = this;
    }
    return ProxifySingletonInstance;
  }

  /**
   * Queue property in undo stack
   *
   * @public
   * @param {Object} prop property to be stacked
   * @param {Function} undo property's undo handler
   * @param {Function} redo  prperty's redo handler
   */
  queueUndoable(prop, undo, redo) {
    this.undoStack.push({
      hash: this.hash,
      prop: prop,
      undo: undo,
      redo: redo,
      url: window.location.pathname
    });
    if (this.undoStack.length > this.stackSize) {
      this.undoStack.shift();
    }
    this.emit("changed");
  }

  /**
   * Regenerate change hash
   *
   * @public
   */
  regenHash() {
    this.hash = performance.now();
  }

  /**
   * Undos last matching hash occurences in undostack and pools them in redo stack
   *
   * @public
   */
  undo() {
    if (this.undoStack.length) {
      const curr_hash = this.undoStack[this.undoStack.length - 1].hash;
      let undo_url = null;
      while (this.undoStack[this.undoStack.length - 1] && this.undoStack[this.undoStack.length - 1].hash != null && this.undoStack[this.undoStack.length - 1].hash === curr_hash) {
        this.undoStack[this.undoStack.length - 1].undo();
        this.redoStack.push(this.undoStack[this.undoStack.length - 1])
        undo_url = this.undoStack[this.undoStack.length - 1].url;
        this.undoStack.pop();
      }
      if (undo_url) {
        this.emit("undo", {
          path: undo_url
        });
      }
    }
  }

  /**
   * Redos last matching hash occurences in redostack and pools them in undo stack
   *
   * @public
   */
  redo() {
    if (this.redoStack.length) {
      let undo_url = null;
      const curr_hash = this.redoStack[this.redoStack.length - 1].hash;
      while (this.redoStack[this.redoStack.length - 1] && this.redoStack[this.redoStack.length - 1].hash != null && this.redoStack[this.redoStack.length - 1].hash === curr_hash) {
        this.redoStack[this.redoStack.length - 1].redo();
        this.undoStack.push(this.redoStack[this.redoStack.length - 1])
        undo_url = this.undoStack[this.undoStack.length - 1].url;
        this.redoStack.pop();
      }
      if (undo_url) {
        this.emit("undo", {
          path: undo_url
        });
      }
    }

  }

}

var ProxifySingletonInstance = new ProxifySingleton();


/**
 * @class Proxify
 * @classdesc Proxify enables object properties proxiying. Classes extended using a Proxify instance will be grnated with 
 * Undo/redo capabilities
 */
class Proxify {

  /**
   * Creates an instance of Proxify.
   * 
   * @param {Array} except Blacklist of properties that should not be proxified
   * @memberof Proxify
   */
  constructor(except) {
    except = except || [];
    except.push('except');
  }

  /**
   * Proxifies instance by proxifying non-array data and
   * exposing pushAndStackUndo/spliceAndStackUndo methods to
   * arrays for them to be used through the instance's lifecycle as a push/splice
   * alternative. Doing so will ensure that modification will be stacked into the
   * undo/redo stacks
   *
   * @public
   * @param {Array} [except=[]]
   * @return {Proxy} Proxified instance (this) 
   */
  proxify(except = []) {
    this.except = except
    Object.keys(this).forEach(key => {
      if (this[key] != null && typeof this[key] === 'object' && !this.except.includes(key)) {
        if (Array.isArray(this[key])) {
          var self = this;
          this[key].pushAndStackUndo = (value) => {
            ProxifySingletonInstance.queueUndoable(key, () => {
              self[key].pop();
            }, () => {
              self[key].splice();
              self[key].push(value)
            })
            self[key].splice();
            return self[key].push(value)
          }
          this[key].spliceAndStackUndo = (index, count) => {
            const value_cp = Object.assign(Object.create(Object.getPrototypeOf(self[key][index])), self[key][index])
            ProxifySingletonInstance.queueUndoable(key, () => {
              self[key].splice(index, 0, value_cp);
            }, () => {
              self[key].splice(index, count);
            })
            console.log(self[key])
            return self[key].splice(index, count);
          }
        }
      }
    })
    return new Proxy(this, this.handler);
  }

  /**
   * proxied props handler
   *
   * @readonly
   */
  get handler() {
    var self = this;
    return {
      set(target, prop, value) {
        if (!self.except.includes(prop)) {
          const oldValue = target[prop]
          ProxifySingletonInstance.queueUndoable(prop, () => {
            target[prop] = oldValue
          }, () => {
            target[prop] = value
          })
          ProxifySingletonInstance.emit("changed");
        }
        return Reflect.set(...arguments);
      }
    }
  }

}

export {
  ProxifySingletonInstance as ProxifySingleton, Proxify
};