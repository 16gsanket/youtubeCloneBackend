import asynchandler from '../utils/asyncHandler.js'

const registerUser = asynchandler( (req , res) =>{
    res.status(200).json({
        message:"OK"
    })
} )

export default registerUser