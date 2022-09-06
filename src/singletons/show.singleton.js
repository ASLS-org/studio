'use strict'

import Show from '@/models/DMX/show.model'

/**
 * @class ShowSingleton
 * @extends {Show}
 * @classdesc Singleton instance of Show to be used throughout the project
 */
class ShowSingleton extends Show{

  constructor(){
    if(!showSingletonInstance){
      super();
      showSingletonInstance = this;
    }
    return showSingletonInstance;
  }

}

var showSingletonInstance = new ShowSingleton();
export default showSingletonInstance;