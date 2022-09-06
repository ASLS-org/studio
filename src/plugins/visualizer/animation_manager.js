 var THREE = window.THREE = require('three');
 const ANIMATION_PLAYING = 0x00; //Defines the animation's playing status
 const ANIMATION_PAUSED = 0x01; //Defines the animation's paused status

 var animationId = 0;

 /**
  * @class AnimationManager, a singleton handling animations of every animated
  * objects contained within the scene
  */
 class AnimationManager {

   constructor() {
     if (!instance) { //Ensuring singleness
       this.animations = []; //Preparing animations array
       this.update(); //Launchin update cycle
     }
     instance = this; //Updating singleton's parameters
   }


   /**
     * @param {Animation} animation an animation instance
    * @param {Instance} ctx an instance providing context for the animation loop execution
    */
   add(loop) {
     var animation = new Animation(loop); //Creating a new Animation instance from the provided looop
     this.animations.push(animation); //Pushing animation into the instance's array
     return animation; //Returning animation instance
   }

   /**
     * @param {Animation} animation an animation instance
    */
   dispose(animation) {
     let id = animation.id; //Fetching the animation's id
     let index = AnimationManager._getAnimationIndex(id, this.animations); //Finding the animation's index within the instance's array
     index ? this.animations.splice(index, 1) : console.log(new Error("not found")) //Removing the animation or throwing error if id was not found
   }

   /**
     * animation array.
    */
   update() {
     var self = this;
     this.animations.forEach(function (animation) { //Looping through each animations
       animation.update(); //Updating animation
     })
     requestAnimationFrame(self.update.bind(self)); //Requesting animationFrame
   }


   /**
     * "animations" array using its id. This method is set static as it shall not
    * be refferenced oustide of the class.
    * @param {String} animationId the animation's id
    * @param {Array} animations the animation array containing the animation
    */
   static _getAnimationIndex(animationId, animations) {
     return (animations.findIndex(function (animation) { //Returning index
       return animation.id === animationId //Searching id matches
     }))
   }

 }


 /**
  * @class Animation, a class defining an animimation instance to be managed from
  * the AnimationManager
  */
 class Animation {

   /**
    * @param {Function} loop the loop method to be called at each animation cycle
    * @param {Instance} ctx an instance providing context for the animation loop execution
    */
   constructor(loop) {
     this.id = animationId++; //Generating a unique identifier
     this._clock = new THREE.Clock(); //Initialising a new clock instance
     this.loop = loop; //Setting the animation's loop
     this.status = ANIMATION_PLAYING //Setting the animation status as "ANIMATION_PLAYING"
   }


   /**
     * @param {Integer} status the status to be set. Value should be 0 or 1
    */
   set state(status) {
     if (status == ANIMATION_PLAYING || status == ANIMATION_PAUSED) { //Checking if status to be set does exist
       this.status = status; //Updating status
     }
   }

   update() {
     if (this.status === ANIMATION_PLAYING) { //Making sure that status is set to "ANIMATION_PLAYING"
       this.loop(this._clock.getElapsedTime()); //Updating animation using the instance's clock and providing context to called method
     }
   }

 }

 var instance = new AnimationManager(); //Ensuring singleness
 export default instance //Exporting module through default export