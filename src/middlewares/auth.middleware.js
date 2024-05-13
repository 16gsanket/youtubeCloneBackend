import { apiError } from "../utils/apiError"
import asyncHandler from "../utils/asyncHandler"
import jwt from "json-web-token"
import { User } from "../models/user.model"


// res if not used , we can write _
export const verifyJWT = asyncHandler(async(req ,_,next)=>{

    // getting token from cookies or headers 
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
    
        if(!token){
            throw new apiError(401 , "Token is not present")
        }
    
        //we need to decode the token using th jwt.verify(token , toeknSecret)
    
        const decodedToken = jwt.verifyJWT(token , process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findOne(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new apiError(401  , "access token invalid")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new apiError(401 , error?.message || 'Invalid accessToken')
    }
})