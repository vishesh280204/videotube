import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessandRefreshTokens=async(userId)=>{
    try{
        const user =await User.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    }catch(e){
        throw new ApiError(500,"Something went wrong while generating access and refresh tokens ")

        
    }
}

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

 const loginUser= asyncHandler(async (req,res)=>{
    // check the info is correct or Not
    // check with database
    // if the credentials are onkeydown,grant access and refresh Token 
    // if the access token expires check if refreshtoken is same ornot, if kyes then automatically grant new access token

    const{email,password,username}=req.body
    if(!email && !username ){
        throw new ApiError(400,"Either username or email is required")
    }
    const user=await User.findOne({
            $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"No user found with given credentials")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Password")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)
    
    const loggedInUser= await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully"
        )
    )
    
     
 })

const logoutUser= asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,{},"user logged out"
        )
    )
})

const refreshAccessToken=asyncHandler( async (req,res)=>{

    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.refresh_token_secret)
    
        const user=User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,newRefreshToken}=await generateAccessandRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            200,
            {accessToken,refreshToken:newRefreshToken},
            "Access Token Refreshed"
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }
    

})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body
    // hum id isliye nikal paye kyuki pehle verifyJWT chala hai and humne usme user declare kara tha req me
    const user =await User.findById(req.user?._id)
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
    if(user.password!==oldPassword){
        throw new ApiError(401,"Invalid Old Password")
    }
    user.password=newpassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed successfully"))
})

const getCurrentUser=asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"Current user fetched")
})

const updateAccountDetails=asyncHandler(async (req,res)=>{
    const {email,fullName}=req.body
    const user=User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                email,
                fullName:fullName
            }
        },
        {new : true}
    ).select("-password")
    
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details Updated"))
})
const updateUserAvatar=asyncHandler(async (req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar File is missing")
    }
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on cloudinary")
    }
    const u= await User.findById(req.user?._id)
    const oldUrl=u.avatar

    const user=await User.findByIdAndUpdate(req.user?._id,
        {
             $set:{
                avatar:avatar.url
             }
        },
        {new:true}
    ).select("-password")

    if (oldUrl) {
        await deleteFromCloudinary(oldUrl, "image");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated Successfully"))
})

const updateUserCoverImage=asyncHandler(async (req,res)=>{
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"CoverImage File is missing")
    }
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on cloudinary")
    }
    const u= await User.findById(req.user?._id)
    const oldUrl=u.coverImage
    const user =await User.findByIdAndUpdate(req.user?._id,
        {
             $set:{
                coverImage:coverImage.url
             }
        },
        {new:true}
    ).select("-password")

    if (oldUrl) {
        await deleteFromCloudinary(oldUrl, "image");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,user,"CoverImage updated Successfully"))
})

const getChannelInfo= asyncHandler(async (req,res)=>{
    //ye hum url me se username get kar rhe hai
    const {username}=req.params
    if(!username.trim()){
        throw new ApiError(400,"Username not found in url")
    }
    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers",
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"`_id",
                foreignField:"subscriber",
                as:"subscribedTo",
            }
        },
        {
            addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },

                subscribedToCount:{
                    $size:"$subscribedTo"
                },

                isSubscribed:{
                    $cond:{
                        if:{
                            $in:[req.user?._id,"subscribers.subscriber"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                subscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    if(!channel.length){
        throw new ApiError(404,"Channel doesnt exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})
 

const getWatchHistory = asyncHandler(async (req,res)=>{
     const user= await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            },
            $lookup:{
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:{
                                $project:{
                                    fullName:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                    

                ]
            }

        }
     ])
     return res
     .status(200)
     .json(
        new ApiResponse(200,user[0].watchHistory,"Watch History fetched ")
     )
})
 export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getChannelInfo,getWatchHistory}