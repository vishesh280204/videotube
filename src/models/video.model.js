import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
 const videoSchema= new Schema({
    videoFile:{
        type:String, //cloudinary
        required:true,
        unique:true
    },
    thumbnail:{
        type:String, //cloudinary
        required:true,
        unique:true
    },
    title:{
        type:String, 
        required:true,
        unique:true
    },
    description:{
        type:String, 
        required:true,
        unique:true
    },
    duration:{
        type:Number, 
        required:true,
        unique:true
    },
    views:{
        type:Number, 
        required:true,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }




 },{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate) 

 export const Video= mongoose.model("Video",videoSchema)