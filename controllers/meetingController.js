import {
	getAvailability,
	updateAvailability,
	createEvent,
	getEvents,
	disableEvent,
	// getSchedulePageData,
	scheduleMeeting,
	cancelSheduledMeeting,
	getAllScheduledMeeting,
	// getEventsByUsername,
	// getEventsByOnelink,
	createPaymentSession,
	verifyPayment,
} from "../services/meetingService.js";

export const getAvaibilityController = async (req, res) => {
	try {
		const { userId } = req;
		const response = await getAvailability(userId, req.body);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while updating availability.",
		});
	}
};

export const updateAvaibilityController = async (req, res) => {
	try {
		const { userId } = req;
		const response = await updateAvailability(userId, req.body);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while updating availability.",
		});
	}
};

export const createEventController = async (req, res) => {
	try {
		const { userId } = req;
		const response = await createEvent(userId, req.body);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while updating availability.",
		});
	}
};

export const getEventsController = async (req, res) => {
	try {
		const { userId } = req;
		const response = await getEvents(userId);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while fetching events.",
		});
	}
};

export const disableEventController = async (req, res) => {
	try {
		const { userId } = req;
		const { eventId } = req.params;
		const response = await disableEvent(userId, eventId);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while disabling event.",
		});
	}
};

export const getALLScheduledMeetings = async (req, res) => {
	try {
		const { userId } = req;
		const { meetingType } = req.params;
		console.log("meetingType", meetingType);
		const response = await getAllScheduledMeeting(userId, meetingType);
		res.send(response);
	} catch (error) {
		res.send({
			status: false,
			message: "An error occurred while getting scheduled meeting.",
		});
	}
};

export const cancelSheduledMeetingController = async (req, res) => {
	try {
		const { userId } = req;
		const { meetingId } = req.params;
		const response = await cancelSheduledMeeting(userId, meetingId);
		res.send(response);
	} catch (error) {
		res.send({
			status: false,
			message: "An error occurred while cancelling scheduled meeting.",
		});
	}
};

export const scheduleMeetingController = async (req, res) => {
	try {
		// console.log(userId, req.body);
		const response = await scheduleMeeting(req.body);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while scheduling meeting.",
		});
	}
};

export const createPaymentSessionController = async (req, res) => {
	try {
		// console.log(req.body);
		const response = await createPaymentSession(req.body);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while intiating payment.",
		});
	}
};

export const paymentVerifyController = async (req, res) => {
	try {
		const response = await verifyPayment(req, res);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while verifying payment.",
		});
	}
};
