class apiError extends Error {
  constructor(
    statusCode,
    message = "something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    //Stack is used to point out which file is creating a problm in API callings

    if(stack){
        this.stack = stack
    }else{
        Error.captureStackTrace(this , this.constructor)
    }
  }
}

export { apiError }
