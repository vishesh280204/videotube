import mongoose from "mongoose";
import { db_name } from "../constants.js";

const connectDB= async ()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.mongodb_url}/${db_name}`)
        console.log("mongoDB connected")
        // console.log("mongoDB connected",connectionInstance.connection);
    }
    catch(e){
        console.log("MongoDB conection error ",e);
        process.exit(1);
    }
}
export default connectDB





