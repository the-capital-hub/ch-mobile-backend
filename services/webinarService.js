import { WebinarModel } from "../models/Webinars.js";
import { UserModel } from "../models/User.js";
import { google } from "googleapis";
import { parse, isAfter, addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
// import nodemailer from "nodemailer";
// import {
// 	getSuccessEmailTemplate,
// 	getFailureEmailTemplate,
// } from "../utils/mailHelper.js";
// imports for payment
import crypto from "crypto";
import { Cashfree } from "cashfree-pg";
import { v4 as uuidv4 } from "uuid";

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

const { OAuth2 } = google.auth;
const oAuth2Client = new OAuth2(
	process.env.GOOGLE_MEET_CLIENT_ID,
	process.env.GOOGLE_MEET_CLIENT_SECRET,
	"https://thecapitalhub.in/investor/onelink"
);

// Google Calendars scope
// const SCOPES = ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.calendars"];

export const createWebinar = async (userId, data) => {
	try {
		const user = await UserModel.findOne({ _id: userId });
		if (!user) {
			return {
				status: false,
				message: "User not found",
			};
		}

		// Get the current time
		const currentTime = new Date();
		// Get the user's meeting token information
		let accessToken = user.meetingToken?.access_token;
		let refreshToken = user.meetingToken?.refresh_token;
		let expireIn = user.meetingToken?.expire_in;

		// console.log("Meeting Token", accessToken, refreshToken, expireIn);
		// If the access token is expired, use the refresh token to get a new access token
		if (expireIn && isAfter(currentTime, new Date(expireIn))) {
			const oAuth2Client = new google.auth.OAuth2(
				process.env.GOOGLE_CLIENT_ID,
				process.env.GOOGLE_CLIENT_SECRET,
				process.env.GOOGLE_REDIRECT_URI
			);

			oAuth2Client.setCredentials({ refresh_token: refreshToken });
			const { credentials } = await oAuth2Client.refreshAccessToken();
			accessToken = credentials.access_token;

			// Update the user's meeting token with the new access token and reset the expiration time
			const currentTime = new Date();
			const expireTime = addMinutes(currentTime, 50);
			const formattedExpireTime = formatInTimeZone(
				expireTime,
				"Asia/Kolkata",
				"yyyy-MM-dd'T'HH:mm:ss"
			);

			user.meetingToken.access_token = accessToken;
			user.meetingToken.expire_in = formattedExpireTime;
			await user.save();
		}

		// Set the credentials for the OAuth2 client
		oAuth2Client.setCredentials({ access_token: accessToken });

		// Create the webinar object for the Google Calendar API
		const webinarData = {
			summary: data.title,
			description: data.description,
			start: {
				dateTime: data.startTime,
				timeZone: "Asia/Kolkata",
			},
			end: {
				dateTime: data.endTime,
				timeZone: "Asia/Kolkata",
			},
			conferenceData: {
				createRequest: {
					requestId: Math.random().toString(36).substring(2, 12),
					conferenceSolutionKey: { type: "hangoutsMeet" },
				},
			},
		};

		// Create a Google Calendar API client
		const calendar = google.calendar({
			version: "v3",
			auth: oAuth2Client,
		});

		// Insert the event into the user's primary calendar
		const response = await calendar.events.insert({
			calendarId: "primary",
			requestBody: webinarData,
			conferenceDataVersion: 1,
		});
		// Check if the hangout link is available in the response
		const hangoutLink = response.data.hangoutLink;
		if (!hangoutLink) {
			console.error("Hangout link not found in response.");
		}
		const webinar = await WebinarModel.create({
			userId: user._id,
			link: hangoutLink,
			googleWebinarId: response.data.id,
			...data,
		});
		await UserModel.findByIdAndUpdate(user._id, {
			$push: { webinars: webinar._id },
		});
		return {
			status: true,
			message: "Webinar created successfully",
			data: webinar,
		};
	} catch (error) {
		throw new Error(error.message);
	}
};

function convertDateFormat(dateString) {
	// Create a new Date object from the input string
	const date = new Date(dateString);

	// Extract the day, month, year, hours, and minutes
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
	const year = date.getFullYear();

	// Get hours and minutes
	let hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, "0");

	// Determine AM/PM suffix
	const ampm = hours >= 12 ? "PM" : "AM";
	hours = hours % 12; // Convert to 12-hour format
	hours = hours ? String(hours) : "12"; // the hour '0' should be '12'

	// Format the final string
	const formattedDate = `${day}-${month}-${year}, ${hours}:${minutes} ${ampm}`;

	return formattedDate;
}

function convertDurationToString(duration) {
	// Check if the duration is a valid number
	if (typeof duration !== "number" || duration < 0) {
		return "Invalid duration";
	}

	// Return the formatted string
	return `${duration} Minute${duration !== 1 ? "s" : ""}`;
}

export const getWebinar = async (userId) => {
	try {
		const user = await UserModel.findOne({ _id: userId });
		if (!user) {
			return {
				status: false,
				message: "User not found",
			};
		}
		const webinars = await WebinarModel.find({ userId: user._id }).populate(
			"userId"
		);

		const data = webinars
			.filter((webinar) => webinar.webinarType === "Pitch Day")
			.map((webinar) => {
				return {
					_id: webinar._id,
					date: convertDateFormat(webinar.date),
					title: webinar.title,
					description: webinar.description,
					startTime: convertDateFormat(webinar.startTime),
					endTime: convertDateFormat(webinar.endTime),
					duration: convertDurationToString(webinar.duration),
					discount: webinar.discount.toString(),
					price: webinar.price.toString(),
					link: webinar.link,
					creatorName: webinar.userId.firstName + " " + webinar.userId.lastName,
				};
			});

		return {
			status: true,
			message: "Webinars fetched successfully",
			data: data,
		};
	} catch (error) {
		throw new Error(error.message);
	}
};

export const deleteWebinar = async (userId, webinarId) => {
	try {
		const user = await UserModel.findOne({ _id: userId });
		if (!user) {
			return {
				status: false,
				message: "User not found",
			};
		}
		// Check if user has meeting token and if it is expired or not
		const currentTime = new Date();
		let accessToken = user.meetingToken?.access_token;
		let refreshToken = user.meetingToken?.refresh_token;
		let expireIn = user.meetingToken?.expire_in;

		if (expireIn && isAfter(currentTime, new Date(expireIn))) {
			// Token is expired, use refresh token to get a new access token
			const oAuth2Client = new google.auth.OAuth2(
				process.env.GOOGLE_CLIENT_ID,
				process.env.GOOGLE_CLIENT_SECRET,
				process.env.GOOGLE_REDIRECT_URI
			);

			oAuth2Client.setCredentials({ refresh_token: refreshToken });

			const { credentials } = await oAuth2Client.refreshAccessToken();
			accessToken = credentials.access_token;

			// Get the current time in the specified time zone
			const expireTime = addMinutes(currentTime, 50); // Add 50 minutes to current time

			// Format the expiration time in the desired time zone (Asia/Kolkata)
			const formattedExpireTime = formatInTimeZone(
				expireTime,
				"Asia/Kolkata",
				"yyyy-MM-dd'T'HH:mm:ss" // Format without offset
			);

			// Update the user's meeting token with the new access token and reset the expiration time
			user.meetingToken.access_token = accessToken;
			user.meetingToken.expire_in = formattedExpireTime; // Store the formatted expiration time
			await user.save();
		}

		// Set the credentials for the OAuth2 client
		oAuth2Client.setCredentials({ access_token: accessToken });
		const webinar = await WebinarModel.findOne({
			_id: webinarId,
			userId: user._id,
		});

		if (!webinar) {
			return {
				status: false,
				message: "Webinar not found",
			};
		}

		// Cancel the webinar in Google Calendar
		const calendar = google.calendar({
			version: "v3",
			auth: oAuth2Client,
		});

		await calendar.events.delete({
			calendarId: "primary",
			eventId: webinar.googleWebinarId,
		});

		// Delete the meeting from the database
		// await UserModel.findByIdAndUpdate(user._id, {
		// 	$pull: { webinars: webinar._id },
		// });

		const webinarResponse = await WebinarModel.findOneAndDelete({
			_id: webinarId,
			userId: user._id,
		});
		return {
			status: true,
			message: "Webinar deleted successfully",
			data: {
				_id: webinarResponse._id,
				date: convertDateFormat(webinarResponse.date),
				title: webinarResponse.title,
				description: webinarResponse.description,
				startTime: convertDateFormat(webinarResponse.startTime),
				endTime: convertDateFormat(webinarResponse.endTime),
				duration: convertDurationToString(webinarResponse.duration),
				discount: webinarResponse.discount.toString(),
				price: webinarResponse.price.toString(),
				link: webinarResponse.link,
				creatorName:
					webinarResponse.userId.firstName +
					" " +
					webinarResponse.userId.lastName,
			},
		};
	} catch (error) {
		throw new Error(error.message);
	}
};

// export const getWebinarsByOnelink = async (onelinkId) => {
// 	try {
// 		const user = await UserModel.findOne({ oneLinkId: onelinkId });
// 		if (!user) {
// 			return {
// 				status: false,
// 				message: "User  not found",
// 			};
// 		}
// 		// console.log("userId in getWebinarsByOnelink", user._id);
// 		const webinars = (await WebinarModel.find({ userId: user._id })).filter(
// 			(webinar) => webinar.webinarType === "Pitch Day"
// 		);
// 		// console.log("Pitch Day Webinars", webinars);
// 		return {
// 			status: true,
// 			message: "Webinars fetched successfully",
// 			data: webinars,
// 		};
// 	} catch (error) {
// 		throw new Error(error.message);
// 	}
// };

// function to generate Random oredrId
// async function generateOrderId() {
// 	try {
// 		const uniqueId = crypto.randomBytes(16).toString("hex");
// 		const hash = crypto.createHash("sha256");
// 		hash.update(uniqueId);
// 		return hash.digest("hex").substr(0, 12);
// 	} catch (error) {
// 		console.error("Error generating order ID:", error);
// 		throw new Error("Failed to generate order ID");
// 	}
// }

// export const createPaymentSession = async (data) => {
// 	try {
// 		// Generate order ID
// 		const orderId = await generateOrderId();
// 		console.log("orderId", orderId);
// 		// Generate a random customer ID
// 		const customerId = uuidv4();

// 		// Prepare request payload
// 		const request = {
// 			order_amount: parseFloat(data.amount).toFixed(2),
// 			order_currency: "INR",
// 			order_id: orderId,
// 			customer_details: {
// 				customer_id: customerId,
// 				customer_name: data.name.trim(),
// 				customer_email: data.email.toLowerCase().trim(),
// 				customer_phone: data.mobile.trim(),
// 			},
// 			order_expiry_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes expiry
// 		};

// 		// Create order with Cashfree
// 		const response = await Cashfree.PGCreateOrder("2023-08-01", request);

// 		// Validate response
// 		if (!response?.data?.payment_session_id) {
// 			throw new Error("Invalid response from payment gateway");
// 		}

// 		return {
// 			status: 200,
// 			// orderId: orderId,
// 			data: response.data,
// 		};
// 	} catch (error) {
// 		console.error("Error in creating payment session:", error);
// 		throw new Error(error.message);
// 	}
// };

// Email configuration
// const transporter = nodemailer.createTransport({
// 	host: "smtp.gmail.com",
// 	port: 587,
// 	secure: false, // true for 465, false for other ports
// 	auth: {
// 		user: process.env.EMAIL_USER,
// 		pass: process.env.EMAIL_APP_PASSWORD,
// 	},
// 	tls: {
// 		rejectUnauthorized: false, // Only use during development
// 	},
// });

// Verify transporter configuration
// const verifyTransporter = async () => {
// 	try {
// 		await transporter.verify();
// 		console.log("SMTP connection verified successfully");
// 		return true;
// 	} catch (error) {
// 		console.error("SMTP verification failed:", error);
// 		return false;
// 	}
// };

// Updated email sending function with error handling
// const sendEmail = async (emailOptions) => {
// 	try {
// 		// Verify connection before sending
// 		const isVerified = await verifyTransporter();
// 		if (!isVerified) {
// 			throw new Error("SMTP connection failed");
// 		}

// 		const info = await transporter.sendMail(emailOptions);
// 		console.log("Email sent successfully:", info.messageId);
// 		return true;
// 	} catch (error) {
// 		console.error("Error sending email:", error);
// 		throw new Error(`Failed to send email: ${error.message}`);
// 	}
// };

// export const verifyPayment = async (req, res) => {
// 	try {
// 		// console.log("req.body", req.body);
// 		const { orderId, webinarId, name, email, mobile } = req.body;
// 		// Fetch payment details
// 		const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
// 		console.log("response", response.data[0]);

// 		// Validate response
// 		if (!response?.data) {
// 			throw new Error("Invalid response from payment gateway");
// 		}

// 		// Extract payment status
// 		const paymentStatus = response.data[0].payment_status;

// 		// Define valid payment statuses
// 		// convert all to Capital
// 		const validPaymentStatuses = [
// 			"SUCCESS",
// 			"FAILED",
// 			"PENDING",
// 			"USER_DROPPED",
// 			"NOT_ATTEMPTED",
// 		];

// 		// Check if payment status is valid
// 		// if (!validPaymentStatuses.includes(paymentStatus)) {
// 		// 	throw new Error("Invalid payment status");
// 		// }

// 		// Update payment status in database
// 		const payment = await WebinarModel.findOneAndUpdate(
// 			{ _id: webinarId },
// 			{
// 				$push: {
// 					joinedUsers: {
// 						name: name,
// 						email: email,
// 						mobile: mobile,
// 						orderId: orderId,
// 						paymentId: response.data[0].cf_payment_id,
// 						paymentAmount: response.data[0].order_amount,
// 						paymentStatus,
// 						paymentTime: response.data[0].payment_completion_time,
// 					},
// 				},
// 			},
// 			{ new: true } // This ensures the updated document is returned
// 		).exec();

// 		const webinar = await WebinarModel.findById(webinarId);

// 		const emailOptions = {
// 			from: {
// 				name: "The CapitalHub Team",
// 				address: process.env.EMAIL_USER,
// 			},
// 			to: email,
// 			subject:
// 				paymentStatus === "SUCCESS"
// 					? `🎉 Successfully Registered: ${webinar.title}`
// 					: `⚠️ Payment ${paymentStatus}: ${webinar.title}`,
// 			html:
// 				paymentStatus === "SUCCESS"
// 					? getSuccessEmailTemplate(
// 							name,
// 							webinar.title,
// 							webinar.date,
// 							webinar.startTime,
// 							webinar.link
// 					  )
// 					: getFailureEmailTemplate(name, webinar.title, paymentStatus),
// 		};

// 		await sendEmail(emailOptions);

// 		return {
// 			status: 200,
// 			data: {
// 				orderId,
// 				paymentId: response.data[0].cf_payment_id,
// 				amount: response.data[0].payment_amount,
// 				currency: response.data[0].payment_currency,
// 				status: paymentStatus,
// 				isPaymentSuccessful: validPaymentStatuses.includes(paymentStatus),
// 				paymentMethod: response.data[0].payment_group,
// 				paymentTime: response.data[0].payment_completion_time,
// 				NotificationEmailSent: true,
// 			},
// 		};
// 	} catch (error) {
// 		throw new Error(error.message);
// 	}
// };
