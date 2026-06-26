import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Ensure Cloudinary is configured here in case it's called independently
cloudinary.config({ 
    cloud_name: process.env.cloudinary_cloud_name, 
    api_key: process.env.cloudinary_api_key, 
    api_secret: process.env.cloudinary_api_secret 
});

const deleteFromCloudinary = async (cloudinaryUrl, resourceType = "image") => {
    try {
        if (!cloudinaryUrl) return null;

        // Extract public ID from the Cloudinary URL
        // Example URL: http://res.cloudinary.com/.../upload/v1712345678/folder_name/image_name.jpg
        // The regex extracts "folder_name/image_name" by ignoring the versioning and extension
        const publicIdMatch = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        
        if (!publicIdMatch) {
            console.log("Could not extract public ID from URL");
            return null;
        }

        const publicId = publicIdMatch[1];

        // Delete the file using the extracted public ID
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType // "image" or "video"
        });

        console.log("Old asset deleted from Cloudinary successfully");
        return response;

    } catch (error) {
        console.log("Error while deleting from Cloudinary: ", error);
        return null;
    }
};

export { deleteFromCloudinary };