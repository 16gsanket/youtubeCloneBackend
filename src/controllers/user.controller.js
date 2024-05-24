import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asynchandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose, { mongo } from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    console.log("inside the generation function... , userID is ", userId);

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

    console.log("exiting the generation function with values ", "access ", accessToken , "refresh as ",refreshToken);

    return { refreshToken, accessToken };
  } catch (error) {
    throw new apiError(500, error.message);
  }
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
  // console.log(req.files);

  // the middleware mutler joing the req object with the req.files which has the array of the files uploaded through the multer

  const avatarPath = req.files?.avatar[0]?.path;

  // const coverImagePath = req.files?.coverImage[0]?.path;
  //handling a testcase where the coverImage is not provided

  let coverImagePath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagePath = req.files.coverImage[0].path;
  }

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
  console.log("avatar image uploaded to cloudinary...");

  //Creating user Object(document ) and adding it to cluster (users cluster)

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
  });
  console.log("made a user");

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
  console.log("destructured email and password", email, password);

  // validation if username or email exists
  if (!email && !username) {
    throw new apiError(400, "Provide Email or Username");
  }

  // finding the user from the cred passed
  const userFound = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log("user found ", userFound);
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

  console.log("password is checked", isPasswordValid);
  // generating access and refresh token with await..(not adding await was an error)
  console.log("enetering the tokengenertion function...");
  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    userFound._id
  );

  console.log(
    "refresh and acces tokens generated ...",
    refreshToken,
    accessToken
  );

  // this step ensures that we get the user detals with the refresh token and accesstoken although in final step we do not send the token to the user directly
  const loggedInUser = await User.findById(userFound._id).select(
    "-password -refreshToken"
  );

  console.log("loggedIn user details found here...", loggedInUser);

  //setting cookie confugarations..
  const options = {
    // this 'httpOnly' ensures that only server can change the cookie informations and not anyone
    httpOnly: true,
    secure: true,
  };

  return res
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

const logoutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new apiResponse(200, {}, "User logged out"));
});

// const refreshAccessToken = asynchandler(async(req,res)=>{
//   //getting the refreshToken
//     const incomingRefreshToken = req.cookies.refreshAccessToken || req.body.refreshToken

//     if(!incomingRefreshToken){
//       throw new apiError(401 , " unauthorized request ")
//     }

//     //verify the json token

//     const decoded = jwt.verify(
//       incomingRefreshToken ,
//        process.env.REFRESH_TOKEN_SECRET
//       )

//       const user = await User.findById({_id:decoded._id})

//       if(!user){
//         throw new apiError(401 ,"invalid token")
//       }

// })

const testRoute = asynchandler(async (req, res) => {
  res.status(200).json(201, { data: "success" }, "success in hitting route");
});

const refreshAccessToken = asynchandler(async (req, res) => {
  //getting the refreshToken
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, " unauthorized request ");
  }

  console.log('refresh token from the user ',incomingRefreshToken)
  //verify the json token

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById({ _id: decodedToken._id });

    if (!user) {
      throw new apiError(401, "invalid token");
    }


    // checking if the refresh token match ... from user and from the stored in dataBase
    if (incomingRefreshToken !== user.refreshToken) {
      throw new apiError(201, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken:newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    console.log('new refresh token ', newRefreshToken)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken || 'new one',
          },
          "accessToken refreshed successuflly"
        )
      );
  } catch (error) {
    throw new apiError(
      401,
      error?.message || "Invalid refersh Token..line in try-catch"
    );
  }
});

const changeCurrentUserPassword = asynchandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body; //,confirmPassword


  // check if the new password and confirm password match...not in this one
  // if (confirmPassword && newPassword !== confirmPassword) {
  //   throw new apiError(400, "confirm and newPassword do not match");
  // }

  const user = await User.findById({ _id: req.user?._id });

  if (!user) {
    throw new apiError(400, "user not found! error in pswdchange controller");
  }

  const ispasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!ispasswordCorrect) {
    throw new apiError(400, "Invalid old password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asynchandler(async (req, res) => {

  if(!req.user){
    throw new apiError(400 , " user is not logged in")
  }

  return res
    .status(200)
    .json(new apiResponse(200, req.user, "user detail sent "));
});



const updateUserDetails = asynchandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new apiError(400, "need either username or email");
  }

  const user = await User.findOneAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Account Details updated successfully"));
});

const updateUserAvatar = asynchandler(async (req, res) => {
  // do to delete the previous avatar

  //getting the avatar file path from the server to save it into the cloudinary
  const avatarFilePath = req.file?.path;

  // check if avatar file path is available
  if (!avatarFilePath) {
    throw new apiError(200, "avatar file path is not available");
  }

  const avatarURL = await uploadOnCloudCloudinary(avatarFilePath);

  if (!avatarURL.url) {
    new apiError(500, "error while uploading the avatar to cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatarURL.url,
      },
    },
    { new: true }
  ).select("-password");

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(200, user, "avatar updated successfully");
});

const updateUserCoverPhoto = asynchandler(async (req, res) => {
  const coverPhotoPath = req.file?.path;

  if (!coverPhotoPath) {
    throw new apiError(404, "cover photo file path is not available");
  }
  const coverPhotoURL = await uploadOnCloudCloudinary(coverPhotoPath);

  if (!coverPhotoURL.url) {
    new apiError(500, "error while uploading the cover photo to cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverPhotoURL.url,
      },
    },
    { new: true }
  ).select("-password");

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(200, user, "cover-photo updated successfully");
});

// CAUTION : pipelines used in the further 2 conttrollers

const getUserChannelProfile = asynchandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new apiError(400, "username cannot be fetched from the params");
  }

  // This is an aggregate pipeline that retrieves a user's channel information, including the number of subscribers, the number of people they are subscribed to, and whether the current user is subscribed to the channel.
  // The pipeline uses the following stages:
  // 1. Match: Filters the documents based on the user ID.
  // 2. Lookup: Joins the 'User' collection and retrieves the user's subscribers and the channels they are subscribed to.
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      //first pipeline to get the number of subscriber by finding all the chanels ffrom the document
      $lookup: {
        // the model name becomes small case and plural for mongodb storage so Subscription -> subscriptions
        from: "subscriptions",
        localField: "_id",
        foriegnKey: "channel",
        as: "subscribers",
      },
    },
    {
      // second pipleline to get the number of SubscribedTo people to show it in diplay by selecting the fields with only user as current user which gives us array of channle you are subscribed to
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foriegnKey: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      // now add fields to the document to get the number of subscriber and subscribedTo by $size and $addFields
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubscriberToCount: {
          $size: "$subscribedTo",
        },
        // returns true or false for the current user if he is subscribed or not
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        subscriberCount: 1,
        channelSubscriberToCount: 1,
        isSubscribed: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new apiError(
      400,
      "the channel is not being fetched from the database in controller getUserChannelProdile"
    );
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        channel.at(0),
        "channel fetched successfully and sent to the front end in the obejct format"
      )
    );
});

const getWatchHistory = asynchandler(async (req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id: mongoose.Schema.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$first",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, user.watchHistory[0], "wathed hostory in array done")
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  testRoute,
  changeCurrentUserPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverPhoto,
  getUserChannelProfile,
  getWatchHistory,
};
