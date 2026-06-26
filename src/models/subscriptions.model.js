import mongoose, { model , Schema} from "mongoose";

export const subscriptionSchema=new mongoose.Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },

    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }



    
},{timestamp:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema)