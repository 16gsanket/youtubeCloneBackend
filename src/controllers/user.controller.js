import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asynchandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudCloudinary } from "../utils/cloudinary.js";


const registerUser = asynchandler(async (req, res ,next) => {
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
  console.log(req.files)

  const avatarPath = req.files?.avatar[0]?.path;
  // const coverImagePath = req.files?.coverImage[0]?.path;
  //handling a testcase where the coverImage is not provided
  let coverImagePath;

  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.lenght > 0){
    coverImage = req.files.coverImage[0].path
  }
  
  
  
  //checking is avatr is added or not
  if (!avatarPath) {
    throw new apiError(400, "avatar image not uploaded");
  }
  console.log('avatar checked...')
  
  //uploading the images to the cloudinary:-
  const avatar = await uploadOnCloudCloudinary(avatarPath);
  const coverImage  = await uploadOnCloudCloudinary(coverImagePath) ;

  

  if (!avatar) {
    throw new apiError(400, "avatar image not uploaded");
  }
  console.log('avatar image uploaded to cloudinary...')
  
  //Creating user Object and adding it to database
  console.log('making a user')


  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username:username.toLowerCase()
  });
  console.log('made a user')
  console.log(user)

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ) 
  console.log('user object created and ppushed...')

  if(!createdUser){
    throw new apiError(500 , 'something went wrong while registering a user')
  }

  return res.status(201).json(
    new apiResponse(200 , createdUser , "user registered successfully")
  )


});

export default registerUser;
