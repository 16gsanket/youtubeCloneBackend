import mongoose, { Schema } from "mongoose";

import bcrypt from "bcrypt";
import jwt from "json-web-token";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //cloudnary url
      required: true,
      trim: true,
      index: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);



userSchema.pre("save", async function (next) {
  // to hash the password before saving it to the database

  // userSchema.pre is used to do operations before it is saved in the database ,it acts as a middleware
  // this.isModeified is used to check if the password is modified (this.isModifeied is a method of the mongoose )
  // if it is modified then it will not hash it 
  // if it is not modified then it will hash it
  // bycript.hash is used to hash the password
  // 10 is the salt rounds
  // this.password is the password to be hashed

  if (!(this.isModified("password"))) return next();

  this.password =await bcrypt.hash(this.password, 10);
  next();
});

// to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (password) {

  // spend fucking 45 mintues figuring why isPasswordCorrect is not a function only because of the missed 's' in the methods -> 's'
  return await bcrypt.compare(password, this.password);
};




// to generate access token	
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};


// to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
