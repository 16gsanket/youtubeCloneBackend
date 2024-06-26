import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema = new Schema(
    {
        videoFile:{
            type:String,  //cloudnary
            required:true,
            
        },
        thumbnail:{
            type:String,    //cloudnary
            required:true,
        },
        title:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true,
        },
        duration:{
            type:Number,    //cloudnary send the video duation and other details of file like duration,source etc
            required:true,
        },
        views:{
            type:Number,
            default:0,

        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }

    },{timestamps:true}
)

//plugin in used to extent the functionality of the schema or model
VideoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video' , VideoSchema)
