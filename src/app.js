import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app=express()
app.use(cors({
    origin:process.env.cors_origin,
    credentials:true
}));

app.use(express.json({limit:"16kb"})) //for getting json files in request
app.use(express.urlencoded({ // for getting data from url as they might have plus or percentage between them
    extended:true,//for giving nested objects
    limit:"16kb"
}))
app.use(express.static("public")) // this is used to store data in the given folder,here folder name is public

app.use(cookieParser())._route//for getting info from cookie



//routes import
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users",userRouter)
export {app}