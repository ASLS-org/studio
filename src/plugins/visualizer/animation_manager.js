import * as THREE from 'three';

const ANIMATION_PLAYING = 0x00; // Defines the animation's playing status
const ANIMATION_PAUSED = 0x01; // Defines the animation's paused status

let animationId = 0;

/**
  * @class Animation, a class defining an animimation instance to be managed from
  * the AnimationManager
  */
class Animation {
  /**
  * @param {Function} loop the loop method to be called at each animation cycle
  */
  constructor(loop) {
    this.id = animationId++; // Generating a unique identifier
    this._clock = new THREE.Clock(); // Initialising a new clock instance
    this.loop = loop; // Setting the animation's loop
    this.status = ANIMATION_PLAYING; // Setting the animation status as "ANIMATION_PLAYING"
  }

  /**
   * @param {Integer} status the status to be set. Value should be 0 or 1
   */
  set state(status) {
    if (
      status === ANIMATION_PLAYING
      || status === ANIMATION_PAUSED
    ) { // Checking if status to be set does exist
      this.status = status; // Updating status
    }
  }

  update() {
    // Making sure that status is set to "ANIMATION_PLAYING"
    if (this.status === ANIMATION_PLAYING) {
      // Updating animation using the instance's clock and providing context to called method
      this.loop(this._clock.getElapsedTime());
    }
  }
}

/**
  * @class AnimationManager, a singleton handling animations of every animated
  * objects contained within the scene
  */
class AnimationManager {
  constructor() {
    /* eslint-disable no-use-before-define */
    if (!instance) { // Ensuring singleness
      this.animations = []; // Preparing animations array
      this.update(); // Launchin update cycle
    }
    instance = this; // Updating singleton's parameters
    /* eslint-enable no-use-before-define */
  }

  /**
     * @param {Animation} animation an animation instance
    * @param {Instance} ctx an instance providing context for the animation loop execution
    */
  add(loop) {
    // Creating a new Animation instance
    const animation = new Animation(loop);
    // Pushing animation into the instance's array
    this.animations.push(animation);
    // Returning animation instance
    return animation;
  }

  /**
  * @param {Animation} animation an animation instance
  */
  dispose(animation) {
    // Fetching the animation's id
    const { id } = animation;
    // Finding the animation's index within the instance's array
    const index = AnimationManager._getAnimationIndex(id, this.animations);
    // Removing the animation or throwing error if id was not found
    if (index) {
      this.animations.splice(index, 1);
    } else {
      throw new Error('Cannot find animation');
    }
  }

  /**
    * animation array.
    */
  update() {
    const self = this;
    this.animations.forEach((animation) => { // Looping through each animations
      animation.update(); // Updating animation
    });
    requestAnimationFrame(self.update.bind(self)); // Requesting animationFrame
  }

  /**
    * "animations" array using its id. This method is set static as it shall not
    * be refferenced oustide of the class.
    * @param {String} animationId the animation's id
    * @param {Array} animations the animation array containing the animation
    */
  static _getAnimationIndex(id, animations) {
    return (animations.findIndex((animation) => animation.id === id));
  }
}

// eslint-disable-next-line vars-on-top, no-var, import/no-mutable-exports
var instance = new AnimationManager(); // Ensuring singleness
export default instance; // Exporting module through default export
