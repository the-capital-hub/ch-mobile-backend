import { PriorityModel } from "../models/PriorityDM.js";
import { UserModel } from "../models/User.js";
import nodemailer from "nodemailer";
import {
	getUserRegistrationTemplate,
	getPriorityDMSuccessTemplate,
	getFounderPriorityDMTemplate,
	getPriorityDMAnswerTemplate,
} from "../utils/mailHelper.js";
// imports for payment
import crypto from "crypto";
import { Cashfree } from "cashfree-pg";
import { v4 as uuidv4 } from "uuid";

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

// function to generate Random oredrId
async function generateOrderId() {
	try {
		const uniqueId = crypto.randomBytes(16).toString("hex");
		const hash = crypto.createHash("sha256");
		hash.update(uniqueId);
		return hash.digest("hex").substr(0, 12);
	} catch (error) {
		console.error("Error generating order ID:", error);
		throw new Error("Failed to generate order ID");
	}
}

// function to generate Random password
function generatePassword(length = 10) {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let password = "";

	// Generate random bytes and convert them to characters
	const randomBytes = crypto.randomBytes(length);

	for (let i = 0; i < length; i++) {
		// Use the random byte to select a character from the characters string
		const randomIndex = randomBytes[i] % characters.length;
		password += characters[randomIndex];
	}

	return password;
}

function extractNames(fullName) {
	// Split the full name by spaces
	const nameParts = fullName.trim().split(" ");

	// Extract first name and last name
	const firstName = nameParts[0];
	const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

	return { firstName, lastName };
}

// Email configuration
const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_APP_PASSWORD,
	},
	tls: {
		rejectUnauthorized: false, // Only use during development
	},
});

// Verify transporter configuration
const verifyTransporter = async () => {
	try {
		await transporter.verify();
		console.log("SMTP connection verified successfully");
		return true;
	} catch (error) {
		console.error("SMTP verification failed:", error);
		return false;
	}
};

// Updated email sending function with error handling
const sendEmail = async (emailOptions) => {
	try {
		// Verify connection before sending
		const isVerified = await verifyTransporter();
		if (!isVerified) {
			throw new Error("SMTP connection failed");
		}

		const info = await transporter.sendMail(emailOptions);
		console.log("Email sent successfully:", info.messageId);
		return true;
	} catch (error) {
		console.error("Error sending email:", error);
		throw new Error(`Failed to send email: ${error.message}`);
	}
};

export const createPaymentSession = async (data) => {
	try {
		// Generate order ID
		const orderId = await generateOrderId();
		// console.log("orderId", orderId);
		// Generate a random customer ID
		const customerId = uuidv4();

		// Prepare request payload
		const request = {
			order_amount: parseFloat(data.amount).toFixed(2),
			order_currency: "INR",
			order_id: orderId,
			customer_details: {
				customer_id: customerId,
				customer_name: data.name.trim(),
				customer_email: data.email.toLowerCase().trim(),
				customer_phone: data.mobile.trim(),
			},
			order_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes expiry
		};

		// Create order with Cashfree
		const response = await Cashfree.PGCreateOrder("2023-08-01", request);

		// Validate response
		if (!response?.data?.payment_session_id) {
			throw new Error("Invalid response from payment gateway");
		}

		return {
			status: true,
			message: "Payment session created successfully",
			data: response.data,
		};
	} catch (error) {
		console.error("Error in creating payment session:", error);
		throw new Error(error.message);
	}
};

export const verifyPayment = async (req, res) => {
	try {
		console.log("in verifyPayment", req.body);
		const { orderId, name, email, mobile, question, founderUserName } =
			req.body;

		// Validate input
		if (
			!orderId ||
			!name ||
			!email ||
			!mobile ||
			!question ||
			!founderUserName
		) {
			throw new Error("Missing required fields");
		}

		// Find founder
		const founder = await UserModel.findOne({ userName: founderUserName });
		if (!founder) {
			throw new Error("Founder not found");
		}

		// Fetch and validate payment details
		const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
		if (!response?.data?.[0]) {
			throw new Error("Invalid response from payment gateway");
		}

		const payment = response.data[0];
		const paymentStatus = payment.payment_status;

		// Define valid payment statuses
		const VALID_PAYMENT_STATUSES = {
			SUCCESS: "SUCCESS",
			FAILED: "FAILED",
			PENDING: "PENDING",
			USER_DROPPED: "USER_DROPPED",
			NOT_ATTEMPTED: "NOT_ATTEMPTED",
		};

		// Process successful payments
		if (paymentStatus === VALID_PAYMENT_STATUSES.SUCCESS) {
			// Find or create user
			let user = await UserModel.findOne({ email });

			if (!user) {
				user = await createNewUser(name, email, mobile);
				// Send registration email
				await sendRegistrationEmail(user);
			}

			// Create priority DM
			const priorityDM = await createPriorityDM(
				user,
				founder,
				question,
				payment
			);

			// Send confirmation emails
			await sendPriorityDMConfirmation(user, payment.order_amount);
			await sendFounderNotification(founder, user, question);

			return {
				status: true,
				message: "Payment verified successfully",
				data: {
					orderId,
					paymentId: payment.cf_payment_id,
					amount: payment.payment_amount,
					status: paymentStatus,
					NotificationEmailSent: true,
				},
			};
		}

		// Return payment status for non-successful payments
		return {
			status: false,
			data: {
				orderId,
				paymentId: payment.cf_payment_id,
				amount: payment.payment_amount,
				status: paymentStatus,
				NotificationEmailSent: false,
			},
		};
	} catch (error) {
		console.error("Payment verification error:", error);
		throw new Error(`Payment verification failed: ${error.message}`);
	}
};

export const sentPriorityDM = async (data) => {
	try {
		const { name, email, mobile, question, founderUserName } = data;

		// Find founder
		const founder = await UserModel.findOne({ userName: founderUserName });
		if (!founder) {
			throw new Error("Founder not found");
		}

		// Find or create user
		let user = await UserModel.findOne({ email });

		if (!user) {
			user = await createNewUser(name, email, mobile);
			// Send registration email
			await sendRegistrationEmail(user);
		}

		// Create priority DM
		const priorityDM = await PriorityModel.create({
			name: `${user.firstName} ${user.lastName}`,
			email: user.email,
			mobile: user.phoneNumber,
			question,
			answer: "",
			founderId: founder._id,
			userId: user._id,
		});

		// Send confirmation emails
		// await sendPriorityDMConfirmation(user, payment.order_amount);
		await sendFounderNotification(founder, user, question);

		return {
			status: true,
			message: "Priority DM sent successfully",
			data: priorityDM,
		};
	} catch (error) {
		console.error("Error in sending priority DM:", error);
		throw new Error(error.message);
	}
};

// Helper Functions
const createNewUser = async (name, email, mobile) => {
	const { firstName, lastName } = extractNames(name);
	const userName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
	const password = generatePassword();

	return await UserModel.create({
		firstName,
		lastName,
		userName,
		email,
		phoneNumber: mobile,
		password,
	});
};

const createPriorityDM = async (user, founder, question, payment) => {
	return await PriorityModel.create({
		name: `${user.firstName} ${user.lastName}`,
		email: user.email,
		mobile: user.phoneNumber,
		question,
		founderId: founder._id,
		userId: user._id,
		payment: {
			paymentId: payment.cf_payment_id,
			orderId: payment.order_id,
			status: payment.payment_status,
			amount: payment.order_amount,
			paymentTime: payment.payment_completion_time,
		},
	});
};

const sendRegistrationEmail = async (user) => {
	// Add this email in bcc
	const bccEmail = "de.capitalhub@gmail.com";

	const emailOptions = {
		from: {
			name: "The CapitalHub Team",
			address: process.env.EMAIL_USER,
		},
		to: user.email,
		bcc: bccEmail,
		subject: `🎉 Successfully Registered: ${user.firstName} ${user.lastName}`,
		html: getUserRegistrationTemplate(
			`${user.firstName} ${user.lastName}`,
			user.email,
			user.phoneNumber,
			user.userName,
			user.password
		),
	};

	await sendEmail(emailOptions);
};

const sendPriorityDMConfirmation = async (user, amount) => {
	const emailOptions = {
		from: {
			name: "The CapitalHub Team",
			address: process.env.EMAIL_USER,
		},
		to: user.email,
		subject: `🎉 Successfully Sent Priority DM: ${user.firstName} ${user.lastName}`,
		html: getPriorityDMSuccessTemplate(
			`${user.firstName} ${user.lastName}`,
			user.email,
			user.phoneNumber,
			amount
		),
	};

	await sendEmail(emailOptions);
};

const sendFounderNotification = async (founder, user, question) => {
	const emailOptions = {
		from: {
			name: "The CapitalHub Team",
			address: process.env.EMAIL_USER,
		},
		to: founder.email,
		subject: `🎉 New Priority DM from ${user.firstName} ${user.lastName}`,
		html: getFounderPriorityDMTemplate(user.userName, user.email, question),
	};

	await sendEmail(emailOptions);
};

export const getPriorityDMForUser = async (userId) => {
	try {
		const priorityDM = await PriorityModel.find({ userId }).populate(
			"founderId"
		);

		const data = priorityDM.map((priorityDM) => ({
			FounderName:
				priorityDM.founderId.firstName + " " + priorityDM.founderId.lastName,
			FounderPic: priorityDM.founderId.profilePic,
			FounderRating: priorityDM.founderId.rating || "4.5",
			question: priorityDM.question,
			answer: priorityDM.answer,
			isAnswered: priorityDM.isAnswered,
			payment: priorityDM.payment,
		}));
		return {
			status: true,
			message: "Questions fetched successfully",
			data: data,
		};
	} catch (error) {
		console.error("Error fetching priority DM:", error);
		throw new Error("Failed to fetch priority DM");
	}
};

export const getPriorityDMForFounder = async (userId) => {
	try {
		const priorityDM = await PriorityModel.find({
			founderId: userId,
		}).populate("userId");

		console.log("priorityDM", priorityDM);

		const data = priorityDM.map((priorityDM) => ({
			UserName: priorityDM.userId.firstName + " " + priorityDM.userId.lastName,
			UserPic: priorityDM.userId.profilePic,
			UserRating: priorityDM.userId.rating || "4.5",
			question: priorityDM.question,
			answer: priorityDM.answer,
			isAnswered: priorityDM.isAnswered,
			payment: priorityDM.payment,
		}));
		return {
			status: true,
			message: "Questions fetched successfully",
			data: data,
		};
	} catch (error) {
		console.error("Error fetching priority DM:", error);
		throw new Error("Failed to fetch priority DM");
	}
};

export const updatePriorityDM = async (id, userId, data) => {
	try {
		const priorityDM = await PriorityModel.findOne({
			_id: id,
			founderId: userId,
		}).populate("userId");

		if (!priorityDM) {
			return {
				status: false,
				message: "Priority DM not found for the founder",
			};
		}

		priorityDM.answer = data.answer;
		priorityDM.isAnswered = true;
		await priorityDM.save();

		await sendAnswerSuccessNotification(priorityDM.userId, data.answer);

		const data = {
			UserName: priorityDM.userId.firstName + " " + priorityDM.userId.lastName,
			UserPic: priorityDM.userId.profilePic,
			UserRating: priorityDM.userId.rating || "4.5",
			question: priorityDM.question,
			answer: priorityDM.answer,
			isAnswered: priorityDM.isAnswered,
			payment: priorityDM.payment,
		};

		return {
			status: true,
			message: "Priority DM updated successfully",
			data: data,
		};
	} catch (error) {
		console.error("Error updating priority DM:", error);
		throw new Error("Failed to update priority DM");
	}
};

const sendAnswerSuccessNotification = async (user, answer) => {
	const emailOptions = {
		from: {
			name: "The CapitalHub Team",
			address: process.env.EMAIL_USER,
		},
		to: user.email,
		subject: `🎉 ✨ Founder Successfully Answered your Priority DM: ${user.firstName} ${user.lastName}`, // Your Priority DM Has Been Answered!
		html: getPriorityDMAnswerTemplate(
			user.firstName + " " + user.lastName,
			user.email,
			user.phoneNumber,
			answer
		),
	};

	await sendEmail(emailOptions);
};

export const getQuestionById = async (userId, questionId) => {
	try {
		const question = await PriorityModel.findOne({
			_id: questionId,
		})
			.populate("founderId")
			.populate("userId");

		const data = {
			FounderName:
				question.founderId.firstName + " " + question.founderId.lastName,
			FounderPic: question.founderId.profilePic,
			FounderRating: question.founderId.rating || "4.5",
			UserName: question.userId.firstName + " " + question.userId.lastName,
			UserPic: question.userId.profilePic,
			UserRating: question.userId.rating || "4.5",
			question: question.question,
			answer: question.answer,
			isAnswered: question.isAnswered,
			payment: question.payment,
		};
		return {
			status: true,
			message: "Question fetched successfully",
			data: data,
		};
	} catch (error) {
		console.error("Error fetching question:", error);
		throw new Error("Failed to fetch question");
	}
};
