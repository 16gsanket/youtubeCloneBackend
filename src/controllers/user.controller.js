import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asynchandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById({ userId });

  // In the userSchema file, the generateRefreshToken and generateAccessToken methods are defined as part of the userSchema methods.
  // These methods are defined to be available on instances of the User model.

  // When you fetch a user from the database using User.findById({ userId }), the retrieved user object represents an instance of the User model.
  // Therefore, you can directly call the generateRefreshToken and generateAccessToken methods on this user object.

  // In the user.controller.js file, when you have the line:
  // const user = await User.findById({ userId });
  // The user object you receive from this query is an instance of the User model, which means you can call the generateRefreshToken and generateAccessToken methods directly on this user object.

  const refreshToken = user.generateRefreshToken();
  const accessToken = user.generateAccessToken();

  //saved the refreshtokrn in the database for further use
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { refreshToken, accessToken };
};

const registerUser = asynchandler(async (req, res, next) => {
  //Get user details from Front-End
  // Validation not empty
  // check if user already exists: Check username,email
  // check for images avarar
  // update to cloudinary, check avatar upload on cloud
  // create user object-create entry in db
  // remove pass & refresh token firled from response
  // check for the user creation -> return response

  // console.log('inside the user.controlller.js')

  const { fullName, username, email, password } = req.body;

  //validation step
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "all fields are required");
  }

  //Cehck if use Exists step
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new apiError(
      409,
      "User already exists with the same username or email"
    );
  }

  //getting the path of images uploaded on server..\
  console.log(req.files);

  const avatarPath = req.files?.avatar[0]?.path;
  // const coverImagePath = req.files?.coverImage[0]?.path;
  //handling a testcase where the coverImage is not provided
  let coverImagePath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.lenght > 0
  ) {
    coverImage = req.files.coverImage[0].path;
  }

  //checking is avatr is added or not
  if (!avatarPath) {
    throw new apiError(400, "avatar image not uploaded");
  }
  console.log("avatar checked...");

  //uploading the images to the cloudinary:-
  const avatar = await uploadOnCloudCloudinary(avatarPath);
  const coverImage = await uploadOnCloudCloudinary(coverImagePath);

  if (!avatar) {
    throw new apiError(400, "avatar image not uploaded");
  }
  console.log("avatar image uploaded to cloudinary...");

  //Creating user Object and adding it to database
  console.log("making a user");

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
  });
  console.log("made a user");
  console.log(user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("user object created and ppushed...");

  if (!createdUser) {
    throw new apiError(500, "something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "user registered successfully"));
});

const loginUser = asynchandler(async (req, res) => {
  const { email, username, password } = req.body;

  // validation if username or email exists
  if (!email || !username) {
    throw new apiError(400, "Provide Email or Username");
  }

  // finding the user from the cred passed
  const userFound = await User.findOne({
    $or: [{ username }, { email }],
  });
  // checking if user if found or not
  if (!userFound) {
  throw new apiError(404, "user not found");
}

// checking if password is correct
const isPasswordValid = await userFound.isPasswordCorrect(password);

// checking if password is correct
if (!isPasswordValid) {
  throw new apiError(401, "password is not correct");
}

const { refreshToken, accessToken } = generateAccessAndRefreshTokens(
  userFound._id
);

// this step ensures that we get the user detals with the refresh token and accesstoken although in final step we do not send the token to the user directly
const loggedInUser = await User.findById(userFound._id).select(
  "-password -refreshToken"
);

//setting cookie confugarations..
const options = {
  // this 'httpOnly' ensures that only server can change the cookie informations and not anyone
  httpOnly: true,
  secure: true,
};

res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new apiResponse(
      200,
      { user: loggedInUser, accessToken, refreshToken },
      "user Logged In"
    )
  );
});

/*
const loginUser = asynchandler(async(req,res)=>{
  
  res.status(200).json(new apiResponse(
    200 , {data:'tested success'} , "success"  
  ))
})
*/

const logoutUser = asynchandler(async(req,res) => {
  console.log(req.cookie)
  res.status(200).json(
    new apiResponse(200 , {data : 'req'} , "success")
  )
})


export  {registerUser , loginUser , logoutUser};
