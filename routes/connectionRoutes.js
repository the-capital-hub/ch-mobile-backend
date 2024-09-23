import express from "express";
import {
  sendConnectionRequestController,
  getPendingConnectionRequestsController,
  acceptConnectionRequestController,
  rejectConnectionRequestController,
  getUserConnectionsController,
  removeConnectionController,
  cancelConnectionRequestController,
  getSentPendingConnectionRequestsController,
  getRecommendationsController,
} from "../controllers/connectionController.js"; 
import { authenticateToken } from "../middlewares/authenticateToken.js";
const router = express.Router();

router.use(authenticateToken);

router.post("/sendConnectionRequest", sendConnectionRequestController);
router.get("/getSentPendingConnectionRequests", getSentPendingConnectionRequestsController);
router.delete("/cancelConnectionRequest/:connectionId", cancelConnectionRequestController);
// router.get("/getPendingConnectionRequests/:userId", getPendingConnectionRequestsController);
router.get("/getPendingConnectionRequests/", getPendingConnectionRequestsController);
router.patch("/acceptConnectionRequest/:connectionId", acceptConnectionRequestController);
router.patch("/rejectConnectionRequest/:connectionId", rejectConnectionRequestController);
router.get("/getUserConnections/:userId", getUserConnectionsController);
router.delete("/removeConnection/:otherUserId", removeConnectionController);

router.get("/getRecommendations/:userId", getRecommendationsController);

export default router;
