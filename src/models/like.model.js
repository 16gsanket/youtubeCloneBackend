import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        video:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Video'
        },
        comment:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'comment'
        },
        tweet:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'tweet'
        },
        likedBy:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'

        }

    },{timestamps:true}
)

export const Like = mongoose.model("Like" , likeSchema)