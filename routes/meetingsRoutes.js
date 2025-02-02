import express from "express";

import { authenticateToken } from "../middlewares/authenticateToken.js";

import {
	getAvaibilityController,
	updateAvaibilityController,
	createEventController,
	getEventsController,
	disableEventController,
	// getSchedulePageDataController,
	scheduleMeetingController,
	cancelSheduledMeetingController,
	getALLScheduledMeetings,
	// getEventsByUsernameController,
	// getEventsByOnelinkController,
	createPaymentSessionController,
	paymentVerifyController,
} from "../controllers/meetingController.js";

const router = express.Router();
// {baseUrl}/meetings/
// http://localhost:8080/meetings/
// router.get("/getEvents/:username", getEventsByUsernameController);
// router.get("/getEventsByOnelinkId/:onelinkId", getEventsByOnelinkController);
// router.get(
// 	"/getSchedulePageData/:username/:eventId",
// 	getSchedulePageDataController
// );

router.post("/scheduleMeeting", scheduleMeetingController);
router.post("/createPaymentSession", createPaymentSessionController);
router.post("/verifyPayment", paymentVerifyController);

// Authorized routes below
router.use(authenticateToken);
router.get("/getAvailability", getAvaibilityController);
router.post("/updateAvailability", updateAvaibilityController);
router.post("/createEvent", createEventController);
router.get("/getEvents", getEventsController); // For getting user specific events
router.patch("/disableEvent/:eventId", disableEventController);
router.delete(
	"/cancelScheduledMeeting/:meetingId",
	cancelSheduledMeetingController
);
router.get("/getALLScheduledMeetings/:meetingType", getALLScheduledMeetings);

export default router;

// Route :/meetings/scheduleMeeting
// Response:
// {
//    status: true,
//    message: 'Meeting scheduled successfully',
//    data: {}
// }
// request body: {
//    eventId: 'eventId',
//    name: 'name',
//    email: 'email',
//    additionalInfo: 'additionalInfo',
//    startTime: 'startTime',
//    endTime: 'endTime',
//       title: 'title',
//       date: '',
//       paymentStatus: '"Paid", "Not Paid", "Failed", "Not Required"',
// }
