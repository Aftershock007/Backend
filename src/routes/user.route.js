import { Router } from "express"
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateCurrentPassword,
  updateAccountDetails,
  updateUserAvatar
} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    }
  ]),
  registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(verifyJWT, refreshAccessToken)

router.route("/user").get(verifyJWT, getCurrentUser)

router.route("/update-password").post(verifyJWT, updateCurrentPassword)

router.route("/update-user-details").post(verifyJWT, updateAccountDetails)

router.route("/update-avatar").post(
  verifyJWT,
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    }
  ]),
  updateUserAvatar
)

export default router
