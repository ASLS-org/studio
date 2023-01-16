'use strict'

/**
 * @class Master
 * @classdesc Show master model definition. Master holds a reference to
 * each individual show group. Master features include grouped chase triggering,
 * Global group master output definition and much more. 
 * Could extend event emitter but callback function for end should work just fine.
 */
class Master {

  /**
   * Creates an instance of Master.
   * @param {Object} groupPoolHandle handle to group pool instance to be mastered.
   * @todo This was rushed, it would make more sense to manage group definition though
   * a master instance that would be property of Show.
   */
  constructor(groupPoolHandle) {
    this.groupPool = groupPoolHandle;
    this.playingRow = -1;
    this.onEnd = ()=>{};
  }

  cueRow(rowIndex) {
    let chaseCount = 0;
    let state = rowIndex != this.playingRow; 
    this.groupPool.groups.forEach(group => {
      group.chasePool.chases.forEach(chase => {
        chase.cue(false);
        chase.onEnd = ()=>{};
        // chaseCount++;
      })
      try{
        let chase = group.chasePool.getFromId(rowIndex);
        chaseCount++;
        chase.cue(state)
        chase.onEnd = ()=>{
          chaseCount--;
          if(chaseCount == 0){
            this.onEnd();
          }
        }
        // eslint-disable-next-line
      }catch(err){}
    })
    return this.playingRow = (state && chaseCount) ? rowIndex : -1;
  }

}

export default Master;