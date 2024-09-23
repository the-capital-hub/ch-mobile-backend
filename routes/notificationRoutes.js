import express from "express";
import {
  addNotificationController,
  getNotificationsByUserIdController,
  markMessageAsReadController,
  markAllMessagesAsReadController,
  getUnreadNotificationCountController,
} from "../controllers/notificationController.js";

import { authenticateToken } from "../middlewares/authenticateToken.js";
const router = express.Router();

router.use(authenticateToken);

router.post("/addNotification", addNotificationController);
router.get("/getNotification/:userId", getNotificationsByUserIdController);
router.patch("/markMessageAsRead/:messageId", markMessageAsReadController);
router.patch("/markAllNotificationsAsRead", markAllMessagesAsReadController);
router.get("/getNotificationCount", getUnreadNotificationCountController);

export default router;
