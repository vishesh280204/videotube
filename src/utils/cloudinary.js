import {v2 as cloudinary} from "cloudinary"
import fs from "fs" //used for file system
import dotenv from "dotenv";
dotenv.config();
cloudinary.config({ 
        cloud_name:process.env.cloudinary_cloud_name,
        api_key: process.env.cloudinary_api_key,
        api_secret: process.env.cloudinary_api_secret, // Click 'View API Keys' above to copy your API secret
    });

const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath)return null;
    const response=await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto",

    })
    //file uploaded succesfully
    console.log("file is uploaded ",response.url);

    return response;
    
    }
    catch(e){
        console.log("error in cloudinary",e);
        
        return null;
    }
    finally{
        fs.unlinkSync(localFilePath)//delete locally saved file
    }
}
export {uploadOnCloudinary}