import express from "express";
import {
  createStartUpController,
  editOnePager,
  editStartUpIntroMessage,
  editStartUpOneLink,
  getOnePagerController,
  startUpData,
  investNowController,
  getStartUpByIdController,
  getStartupByFounderIdController,
  getAllStartupsController,
  getStartupsBySearchController,
  createMilestoneController,
  getMileStoneController,
  addMilestoneToUserController,
  getUserMilestonesController,
  deleteUserMilestoneController,
  deleteStartUpController
} from "../controllers/startUpController.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

// Create a new startUp
router.post("/createStartup", createStartUpController);

// Phase 2
// OneLink Page Data

router.get("/getOnePager/:oneLink", getOnePagerController);

router.get(
  "/getStartupById/:startupId",
  getStartUpByIdController
);

router.get(
  "/getStartupByFounderId/:founderId",
  getStartupByFounderIdController
);

router.post("/investNow", investNowController);


router.post("/createMilestone", createMilestoneController);
router.get("/getUserMilestones/:oneLinkId", getUserMilestonesController);

// Middleware for checking token
router.use(authenticateToken);
router.put("/delete_startup",deleteStartUpController)
// Get startup data
router.get("/details/:userId", startUpData);

// OneLink Page
router.patch("/onelink", editStartUpOneLink);
router.patch("/introMessage", editStartUpIntroMessage);
router.put("/onePager", editOnePager);

router.get("/getAllStartUps", getAllStartupsController);
router.get("/searchStartUps/:searchQuery", getStartupsBySearchController);
router.get("/getAllMileStone", getMileStoneController);

//milestone 
router.post("/addMilestoneToUser", addMilestoneToUserController);
router.delete("/deleteUserMilestone/:oneLinkId/:milestoneId", deleteUserMilestoneController);


export default router;
