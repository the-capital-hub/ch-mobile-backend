import express from "express";

import { authenticateToken } from "../middlewares/authenticateToken.js";

import {
	updateAvaibilityController,
	createEventController,
	getEventsController,
	deleteEventController,
	getSchedulePageDataController,
	scheduleMeetingController,
	cancelSheduledMeetingController,
	getALLScheduledMeetings,
	getEventsByUsernameController,
	getEventsByOnelinkController,
	createPaymentSessionController,
	paymentVerifyController,
} from "../controllers/meetingController.js";

const router = express.Router();
// {baseUrl}/meetings/
// http://localhost:8080/meetings/
router.get("/getEvents/:username", getEventsByUsernameController);
router.get("/getEventsByOnelinkId/:onelinkId", getEventsByOnelinkController);
router.post("/scheduleMeeting", scheduleMeetingController);
router.post("/createPaymentSession", createPaymentSessionController);
router.post("/verifyPayment", paymentVerifyController);
router.get(
	"/getSchedulePageData/:username/:eventId",
	getSchedulePageDataController
);

// Authorized routes below
router.use(authenticateToken);
router.post("/updateAvailability", updateAvaibilityController);
router.post("/createEvent", createEventController);
// For getting user specific events
router.get("/getEvents", getEventsController);
router.delete("/deleteEvent/:eventId", deleteEventController);

// for fetching user, event and user availability

// for schedulling meeting
router.delete(
	"/cancelScheduledMeeting/:meetingId",
	cancelSheduledMeetingController
);
router.get("/getALLScheduledMeetings", getALLScheduledMeetings);

export default router;

// Route :/meetings/updateAvailability
// Response:
// {
//    status: true,
//    message: 'Availability updated successfully',
//    data: {}
// }
// request body: {
//    userId: 'userId',
//    dayAvailability: [{
//       day: "Monday",
//       startTime: "10:00",
//       endTime: "12:00",
//    }],
//    minGap: 30,
// }

// Route :/meetings/createEvent
// Response:
// {
//    status: true,
//    message: 'Event created successfully',
//    data: {}
// }
// request body: {
//    title: 'title',
//    description: 'description',
//    duration: 1,
//    eventType: 'Pitch Day/Public/Private',
//    price: 1,
//    discount: 0
//    communityId: 'communityId',
// }

// Route :/meetings/getEvents
// Response:
// {
//    status: true,
//    message: 'Events fetched successfully',
//    data: {
//       events: [{
//          _id: '',
//          userId: {},
//          title: 'title',
//          description: 'description',
//          duration: 1,
//          eventType: 'Pitch Day/Public/Private',
//          price: 1,
//          discount: 0
//          communityId: 'communityId',
//          bookings: [],
//       }]
//    }
// }

// Route :/meetings/deleteEvent/:eventId
// Response:
// {
//    status: true,
//    message: 'Event deleted successfully',
//    data: {
//       events: [{
//          _id: '',
//          userId: {},
//          title: 'title',
//          description: 'description',
//          duration: 1,
//          eventType: 'Pitch Day/Public/Private',
//          price: 1,
//          discount: 0
//          communityId: 'communityId',
//          bookings: [],
//       }]
//    }
// }

// Route :/meetings/getALLScheduledMeetings
// Response:
// {
//    status: true,
//    message: 'Scheduled meetings retrieved successfully',
//    data: [{
//       _id: '',
//       userId: {},
//       eventId: {},
//       name: '',
//       email: '',
//       additionalInfo: '',
//       startTime: '',
//       endTime: '',
//       meetingLink: '',
//       googleEventId: ''
//       title: 'title',
//       date: '',
//       paymentStatus: '"Paid", "Not Paid", "Failed", "Not Required"',
//       paymentId: '',
//       paymentAmount: '',
//    }]
// }

// Route :/meetings/cancelScheduledMeeting/:meetingId
// Response:
// {
//    status: true,
//    message: 'Scheduled meeting cancelled successfully',
//    data: {}
// }

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
