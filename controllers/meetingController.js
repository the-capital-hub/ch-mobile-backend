import {
	updateAvailability,
	createEvent,
	getEvents,
	deleteEvent,
	// getSchedulePageData,
	scheduleMeeting,
	cancelSheduledMeeting,
	getAllSheduledMeeting,
	// getEventsByUsername,
	// getEventsByOnelink,
	createPaymentSession,
	verifyPayment,
} from "../services/meetingService.js";

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
		res.status(response.status).send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while updating availability.",
		});
	}
};

export const deleteEventController = async (req, res) => {
	try {
		const { userId } = req;
		const { eventId } = req.params;
		const response = await deleteEvent(userId, eventId);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while updating availability.",
		});
	}
};

export const getALLScheduledMeetings = async (req, res) => {
	try {
		const { userId } = req;
		const response = await getAllSheduledMeeting(userId);
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
