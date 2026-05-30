import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


 const registerUser=asyncHandler(async(req,res)=>{
     
    const{fullName,email,password,username}=req.body
    console.log(email,password)

    if([fullName,email,password,username].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }
    const existedUser= await User.findOne({
        $or:[  {username} , {email} ] 
    })
    
    if(existedUser){

        throw new ApiError(409,"user or email already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is requied")
    }
    console.log("AvatarLocalPath",avatarLocalPath)
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    console.log("*********coverimage",coverImage)
    // console.log("***avatar",avatar)
    if(!avatar){
        throw new ApiError(400,"avatar file is requied")
    }

    const user=await User.create({
        fullName,
        username:username.toLowerCase(),
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url||""
        
    })
    console.log("22222222222",user)
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken" // negative means not to be included
    )

    if(!createdUser){
    
        throw new ApiError(500,"Something went wrong, so user isnt registered")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
 })

 export {registerUser}