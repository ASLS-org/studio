'use strict'

//TODO remove file

class ErrorHandler{

  constructor(){
    if(!ErroHandlerInstance){
      ErroHandlerInstance = this;
    }
    return ErroHandlerInstance
  }

  

}

var ErroHandlerInstance = new ErrorHandler();
export default ErrorHandler;