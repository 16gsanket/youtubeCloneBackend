import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudCloudinary = async (localFilepath) => {
  try {
    if (!localFilepath) return null;

    const response = await cloudinary.uploader.upload(localFilepath, {
      resource_type: "auto",
    });
    //file uploaded
    console.log(
      "file is uploaded on cloudinary , public url is ",
      response.url
    );

    // once the file is uploaded to cloudinary...we will be deleting the file...
    fs.unlinkSync(localFilepath)
    // console.log('response from the cloudinary ' , response)
    return response;
  } catch (error) {
    // removes the locally saved temporary file as the upload operaition got failed
    fs.unlinkSync(localFilepath) 
    return null;
  }
};

export {uploadOnCloudCloudinary}
