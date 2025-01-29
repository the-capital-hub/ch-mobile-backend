import {
	createPaymentSession,
	verifyPayment,
	getPriorityDMForUser,
	getPriorityDMForFounder,
	updatePriorityDM,
	getQuestionById,
} from "../services/priorityDMService.js";

export const createPaymentSessionController = async (req, res) => {
	try {
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

export const getPriorityDMForUserController = async (req, res) => {
	try {
		const { userId } = req;
		const response = await getPriorityDMForUser(userId);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while getting priority DM.",
		});
	}
};

export const getPriorityDMForFounderController = async (req, res) => {
	try {
		const { userId } = req;
		const response = await getPriorityDMForFounder(userId);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while getting priority DM.",
		});
	}
};

export const updatePriorityDMController = async (req, res) => {
	try {
		const { priorityDMId } = req.params;
		const { userId } = req;
		const response = await updatePriorityDM(priorityDMId, userId, req.body);
		res.send(response);
	} catch (error) {
		console.error(error);
		res.send({
			status: false,
			message: "An error occurred while getting priority DM.",
		});
	}
};

export const getPriorityDMByIdController = async (req, res) => {
	try {
		const { questionId } = req.params;
		const { userId } = req;
		const response = await getQuestionById(userId, questionId);
		res.send(response);
	} catch (error) {
		res.send({
			status: false,
			message: "An error occurred while getting priority DM.",
		});
	}
};
