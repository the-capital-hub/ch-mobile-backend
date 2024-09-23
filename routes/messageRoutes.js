import express from "express";
import {
  addMessageController,
  getMessagesController,
  markMessagesAsReadController,
  getUnreadMessageCountController,
  clearAllMessagesController,
  deleteMessageController,
  markMessagesAsReadInCommunitiesController,
  getUnreadMessageCountInCommunitiesController,
  getLastMessageController,
  clearChatController
} from "../controllers/messageController.js";

import { authenticateToken } from "../middlewares/authenticateToken.js";
const router = express.Router();

router.use(authenticateToken);


router.post("/addMessage", addMessageController);
router.get("/getMessages/:chatId", getMessagesController);
router.patch("/markMessagesAsRead/:chatId/:userId", markMessagesAsReadController);
router.get("/getUnreadMessageCount/:chatId/:userId", getUnreadMessageCountController);
router.patch("/clearChatMessages/:chatId", clearAllMessagesController);
router.delete("/deleteMessage/:messageId", deleteMessageController);
router.patch("/markMessagesAsReadInCommunities/:chatId/:userId", markMessagesAsReadInCommunitiesController);
router.get("/getUnreadMessageCountInCommunities/:chatId/:userId", getUnreadMessageCountInCommunitiesController);
router.get("/getAllUnreadMessageCount/:userId", getUnreadMessageCountInCommunitiesController);
router.post("/clearChat/:chatId", clearChatController);
router.get("/getLastMessage/:chatId", getLastMessageController);


export default router;
