import { contactUs, lookingForFundingMail } from "../services/contactUsService.js";

export const contactUsController = async (req, res) => {
	try {
		const response = await contactUs(req.body);
		res.status(response.status).send(response);
	} catch (error) {
		console.error(error);
		res.status(500).send({
			status: 500,
			message: "An error occurred while submitting contact Us",
		});
	}
};

export const lookingForFundingMailController = async (req, res) => {
	try {
		const {
			fundingViaCapitalhubQuestions,
			name,
			email
		} = req.body;
		const response = await lookingForFundingMail(fundingViaCapitalhubQuestions, name, email);
		res.status(response.status).send(response);
	} catch (error) {
		console.error(error);
		res.status(500).send({
			status: 500,
			message: "An error occurred while submitting contact Us",
		});
	}
};