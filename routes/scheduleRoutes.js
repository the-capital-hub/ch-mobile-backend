import express from "express";
import {
  createMeetingController,
  getAllMeetingsController,
  requestBookingSlotController,
  deleteMeetingController,
  acceptRequestController,
  getAllRequestedByForUserController,
  rejectRequestController,
  createMeetingLinkController,
  validateMeetingAuthController,
} from "../controllers/scheduleController.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

router.get("/getAllMeetings/:oneLinkId", getAllMeetingsController);
router.post("/requestBookingSlot/:meetingId", requestBookingSlotController);

router.use(authenticateToken);

router.post("/createMeetingLink", createMeetingLinkController);
router.post("/validateMeetingAuth",validateMeetingAuthController)
router.post("/createMeeting", createMeetingController);
router.delete("/deleteMeeting/:meetingId", deleteMeetingController);
router.post("/acceptMeetingRequest/:meetingId/:requestId", acceptRequestController);
router.delete("/rejectMeetingRequest/:meetingId/:requestId", rejectRequestController);
router.get("/getAllRequests", getAllRequestedByForUserController);

export default router;
