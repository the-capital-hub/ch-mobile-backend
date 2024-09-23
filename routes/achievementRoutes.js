import express from "express";
import {
  createAchievementController,
  getUserAchievementsController,
} from "../controllers/achievementController.js";

import { authenticateToken } from "../middlewares/authenticateToken.js";
const router = express.Router();

router.post("/createAchievement", createAchievementController);

router.use(authenticateToken);

router.get("/getUserAchievements", getUserAchievementsController);

export default router;
