import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import fs from "fs"
import { generateAccessAndRefreshTokens } from "../utils/generateAccessAndRefreshToken.js"
import { options } from "../constants.js"
import jwt from "jsonwebtoken"

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body
  if (
    [name, username, email, password].some(
      (field) => field?.trim() === undefined || null || ""
    )
  ) {
    if (
      req.files &&
      Array.isArray(req.files.avatar) &&
      req.files.avatar.length > 0
    ) {
      fs.unlinkSync(req.files.avatar[0].path)
    }
    throw new ApiError(400, "All fields are required")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists")
  }

  let avatarLocalPath = ""
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path
  }
  let avatar = ""
  if (avatarLocalPath) {
    avatar = await uploadOnCloudinary(avatarLocalPath)
  }

  const user = await User.create({
    name,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    avatar: avatar?.url || ""
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body
  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (!user) {
    throw new ApiError(404, "User does not exists")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  )

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used")
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }
