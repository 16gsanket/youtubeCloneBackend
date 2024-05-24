// const asyncHandler = () => {
//     console.log('hello')
// }
// WAY 1 of writing the wrapper

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next( `${err.message} error from async`));
  };
};

export default asyncHandler ;

/*
const asyncHandler = (functionhandler) => async (req, res, next) => {
    WAY 2 of writing the wrapper
  functionhandler(req, res, next)
    .then()
    .catch((err) => {
      res.status(err.code || 500).josn({
        success: false,
        message: err.message,
      });
    });
    
};
*/

/*
    WAY 3 of writing it
const asyncHandler = (func) => async (req,res,next) => {
    try{
        await func(req,res,next)
    }catch(err){
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })

    }
}*/
