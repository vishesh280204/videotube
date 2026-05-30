//require('dotenv').config({path:'/env'})
import { configDotenv } from "dotenv";
import mongoose from "mongoose";
import connectDB from "./db/index.js";
import { db_name } from "./constants.js";
import dns from "node:dns";
import { hostname } from "node:os";
import express from "express";
import { error } from "node:console";
import { app } from "./app.js";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
configDotenv({
    path:'./.env'
})
connectDB()
.then((res)=>{console.log("connection successful")
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running and listening on port: ${process.env.PORT || 8000}`);
    });
})
.catch((e)=>{console.log("con failed",e)})

console.log("********",process.env.mongodb_url);



//  const app=express();
// // using iife
// ;(async ()=>{
    
//     try{
//         const h=await mongoose.connect(`${process.env.mongodb_url}/${db_name}`)
//         console.log(h.connection)
//         app.on("error",()=>{
//             console.log(error)
//             throw error
//         })
//         app.listen(process.env.PORT),()=>{
//             console.log("app is listening on port ",process.env.PORT)
//         }
//     }
//     catch(e){
//         console.log("**************",e)
//     }
// })()