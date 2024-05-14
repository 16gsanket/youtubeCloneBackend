import { apiError } from "../utils/apiError.js"
import asyncHandler from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"


// res if not used , we can write _
export const verifyJWT = asyncHandler(async(req ,_,next)=>{

    // getting token from cookies or headers 
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
    
        if(!token){
            throw new apiError(401 , "Token is not present")
        }
    
        //we need to decode the token using th jwt.verify(token , toeknSecret)
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedToken)
        
        const user = await User.findOne({_id : decodedToken?._id}).select("-password -refreshToken")
        console.log('surpassed the decoded thing')
    
        if(!user){
            throw new apiError(401  , "access token invalid")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new apiError(401 , error?.message || 'Invalid accessToken')
    }
})