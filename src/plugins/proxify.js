import {
  EventEmitter
} from 'events';
//TODO remove file
const Proxified_EE = new EventEmitter();

export default class Proxified{
  constructor(){};
  proxify(){
    Object.keys(this).forEach(key=>{
      this[key] = new Proxy(this[key], this.handler)
    })
    this.on
    return new Proxy(this, this.handler);
  }
  get handler(){
    return {
      set(){
        console.log("changed");
        Proxified_EE.emit("changed")
      }
    }
  }
}