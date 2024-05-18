import mongoose , {Schema} from "mongoose";

const subscriptionModel = Schema({
    subscriber:{
        type : Schema.Types.ObjectId,  //one who is subscribing 
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, //one to who subscribers is subscribing
        ref:"User"
    }

},{timestamps:true})

export const Subscription = mongoose.model("Subscription" , subscriptionModel)
