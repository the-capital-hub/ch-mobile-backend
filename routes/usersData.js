import express from "express";

import {
  getUsersController,
  registerUserController,
  loginUserController,
  getUserByIdController,
  updateUser,
  updateUserByIdController,
  changePasswordController,
  requestPasswordResetController,
  resetPasswordController,
  searchUsersController,
  addEducationController,
  addExperienceController,
  addStartupToUserController,
  getExploreController,
  getExploreFiltersController,
  addUserAsInvestorController,
  validateSecretKeyController,
  createSecretKeyController,
  googleLoginController,
  updateEducationController,
  updateExperienceController,
  deleteEducationController,
  deleteExperienceController,
  sendOTP,
  verifyOtp,
  createUser,
  addInvestor,
  addStartUp_data,
  getLinkedInProfile,
  handelLinkedin,
  blockUserController,
  getUserByIdBodyController,
  getUsersByUserNameController,
  unblockUserController,
} from "../controllers/userData.js";

import { authenticateToken } from "../middlewares/authenticateToken.js";
import { update_all } from "../controllers/postController.js";
import multer from "multer";
const router = express.Router();

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

router.post("/add_user",upload.single("file"),createUser);
router.post("/add_investor",upload.single("file"),addInvestor);
router.post("/add_startup_data",upload.single("file"),addStartUp_data)
router.post("/update_all", update_all)
router.post("/login", loginUserController);
router.post("/linkdin_login",handelLinkedin);
router.post("/getLinkedInProfile",getLinkedInProfile)
router.post("/createUser", registerUserController);
router.post("/send_otp",sendOTP);
router.post("/verify_otp", verifyOtp)
router.get("/getUserById/:id", getUserByIdController);

router.patch("/updateUserById/:userId", updateUserByIdController);

router.post("/requestPasswordReset", requestPasswordResetController);

router.patch("/resetPassword", resetPasswordController);

//validate onelink secret key 
router.post("/validateSecretKey", validateSecretKeyController);

router.post("/googleLogin", googleLoginController);

// Authorized routes below
router.post("/getUserByUserName", getUsersByUserNameController)
router.use(authenticateToken);

// Profile Page
router.patch("/updateFounder", updateUser);

router.get("/getUser", getUsersController);
router.patch("/changePassword", changePasswordController);


router.get("/search", searchUsersController);

router.patch("/addEducation/:userId", addEducationController);
router.patch("/addExperience/:userId", addExperienceController);
router.patch("/updateEducation/:educationId", updateEducationController);
router.delete("/deleteEducation/:educationId", deleteEducationController);
router.patch("/updateExperience/:experienceId", updateExperienceController);
router.delete("/deleteExperience/:experienceId", deleteExperienceController);

//add existing startups to user
router.patch("/addStartUpToUser", addStartupToUserController);
router.patch("/addUserAsInvestor", addUserAsInvestorController);

// get explore
router.get("/explore", getExploreController);
router.get("/exploreFilters", getExploreFiltersController);

//block user
router.post("/blockuser",blockUserController);
//unblock user
router.post("/unblockuser", unblockUserController);
//getuserbyidbody
router.post("/getUserByIdBody", getUserByIdBodyController);

//create secret key
router.post("/createSecretKey", createSecretKeyController);

export default router;
