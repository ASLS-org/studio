import Show from '@/models/DMX/show.model';

/**
 * @class ShowSingleton
 * @extends {Show}
 * @classdesc Singleton instance of Show to be used throughout the project
 */
class ShowSingleton extends Show {
  constructor() {
    // eslint-disable-next-line no-use-before-define
    if (!showSingletonInstance) {
      super();
      // eslint-disable-next-line no-use-before-define
      showSingletonInstance = this;
    }
    // eslint-disable-next-line no-use-before-define
    return showSingletonInstance;
  }
}

// eslint-disable-next-line vars-on-top, no-var, import/no-mutable-exports
var showSingletonInstance = new ShowSingleton();
export default showSingletonInstance;
