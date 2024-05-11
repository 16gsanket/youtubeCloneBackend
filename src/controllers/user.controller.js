import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asynchandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudCloudinary } from "../utils/cloudinary.js";


const registerUser = asynchandler(async (req, res) => {
  //Get user details from Front-End
  // Validation not empty
  // check if user already exists: Check username,email
  // check for images avarar
  // update to cloudinary, check avatar upload on cloud
  // create user object-create entry in db
  // remove pass & refresh token firled from response
  // check for the user creation -> return response

  const { fullName, username, email, password } = req.body;
  console.log(email);

  //validation step
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "all fields are required");
  }

  //Cehck if use Exists step
  const existedUser = User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new apiError(
      409,
      "User already exists with the same username or email"
    );
  }

  //getting the path of images uploaded on server..
  const avatarPath = req.file?.avatar[0]?.path;
  const coverImagePath = req.file?.coverImage[0]?.path;
  //checking is avatr is added or not
  if (!avatarPath) {
    throw new apiError(400, "avatar image not uploaded");
  }

  //uploading the images to the cloudinary:-
  const avatar = await uploadOnCloudCloudinary(avatarPath);
  const coverImage = await uploadOnCloudCloudinary(coverImagePath);

  if (!avatar) {
    throw new apiError(400, "avatar image not uploaded");
  }

  //Creating user Object and adding it to database
  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username:username.toLowerCase()
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ) 

  if(createdUser){
    throw new apiError(500 , 'something went wrong while registering a user')
  }

  return res.status(201).josn(
    new apiResponse(200 , createdUser , "user registered successfully")
  )


});

export default registerUser;
