import {
	updateAvailability,
	createEvent,
	getEvents,
	deleteEvent,
	getSchedulePageData,
	scheduleMeeting,
	cancelSheduledMeeting,
	getAllSheduledMeeting,
	getEventsByUsername,
	getEventsByOnelink,
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
		res.status(500).send({
			status: 500,
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
		ressend({
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

// Below Code Not Updtated
export const getSchedulePageDataController = async (req, res) => {
	try {
		const { username, eventId } = req.params;
		// console.log(username, eventId);
		const response = await getSchedulePageData(username, eventId);
		res.status(response.status).send(response);
	} catch (error) {
		console.error(error);
		res.status(500).send({
			status: 500,
			message: "An error occurred while updating availability.",
		});
	}
};

export const scheduleMeetingController = async (req, res) => {
	try {
		// console.log(userId, req.body);
		const response = await scheduleMeeting(req.body);
		res.status(response.status).send(response);
	} catch (error) {
		console.error(error);
		res.status(500).send({
			status: 500,
			message: "An error occurred while updating availability.",
		});
	}
};

export const createPaymentSessionController = async (req, res) => {
	try {
		// console.log(req.body);
		const response = await createPaymentSession(req.body);
		res.status(response.status).send(response);
	} catch (error) {
		console.error(error);
		res.status(500).send({
			status: 500,
			message: "An error occurred while intiating payment.",
		});
	}
};

export const paymentVerifyController = async (req, res) => {
	try {
		const response = await verifyPayment(req, res);
		res.status(response.status).send(response);
	} catch (error) {
		console.error(error);
		res.status(500).send({
			status: 500,
			message: "An error occurred while verifying payment.",
		});
	}
};

export const cancelSheduledMeetingController = async (req, res) => {
	try {
		const { userId } = req;
		const { meetingId } = req.params;
		const response = await cancelSheduledMeeting(userId, meetingId);
		res.status(response.status).send(response);
	} catch (error) {
		if (error.response && error.response.status === 401) {
			res.status(401).send({
				status: 401,
				message: "Unauthorized! Please sync with Google.",
			});
		}
		res.status(500).send({
			status: 500,
			message: "An error occurred while cancelling scheduled meeting.",
		});
	}
};

export const getEventsByUsernameController = async (req, res) => {
	try {
		const { username } = req.params;
		const response = await getEventsByUsername(username);
		res.status(response.status).send(response);
	} catch (error) {
		res.status(500).send({
			status: 500,
			message: "An error occurred while getting events by username.",
		});
	}
};

export const getEventsByOnelinkController = async (req, res) => {
	try {
		const { onelinkId } = req.params;
		const response = await getEventsByOnelink(onelinkId);
		res.status(response.status).send(response);
	} catch (error) {
		res.status(500).send({
			status: 500,
			message: "An error occurred while getting events by onelink.",
		});
	}
};
