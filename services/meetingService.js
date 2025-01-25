import { AvailabilityModel } from "../models/Availability.js";
import { UserModel } from "../models/User.js";
import { EventModel } from "../models/Events.js";
import { BookingModel } from "../models/Bookings.js";
import { formatInTimeZone } from "date-fns-tz";
import { parse, isAfter, addMinutes } from "date-fns";
import { google } from "googleapis";
import crypto from "crypto";
import { Cashfree } from "cashfree-pg";
import { v4 as uuidv4 } from "uuid";

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;

const { OAuth2 } = google.auth;
const oAuth2Client = new OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	"https://thecapitalhub.in/investor/onelink"
);

export const updateAvailability = async (userId, data) => {
	console.log(userId);
	console.log(data);
	try {
		const user = await UserModel.findOne({ _id: userId });
		if (!user) {
			return {
				status: 404,
				message: "User  not found",
			};
		}
		console.log(user);

		// Convert day names to lowercase to match the schema
		const normalizedDayAvailability = data.dayAvailability.map((day) => ({
			day: day.day.toLowerCase(), // Normalize to lowercase
			startTime: day.start, // Change to match schema
			endTime: day.end, // Change to match schema
			// enabled: day.enabled,
		}));

		const response = await AvailabilityModel.findOneAndUpdate(
			{ userId: user._id }, // Ensure you're querying with userId
			{
				$set: {
					userId: user._id,
					dayAvailability: normalizedDayAvailability,
					minimumGap: parseInt(data.minGap, 10), // Change to match schema
				},
			},
			{ upsert: true, new: true }
		);
		return {
			status: true,
			message: "Availability updated successfully",
			data: response,
		};
	} catch (error) {
		console.error("Error updating availability:", error);
		return {
			status: false,
			message: "An error occurred while updating availability.",
		};
	}
};

export const createEvent = async (userId, data) => {
	try {
		const user = await UserModel.findOne({ _id: userId });
		if (!user) {
			return {
				status: false,
				message: "User not found",
			};
		}

		const response = await EventModel.create({
			userId: user._id,
			title: data.title,
			description: data.description,
			duration: data.duration,
			eventType: data.eventType,
			price: data.price,
			discount: data.discount,
		});

		await UserModel.findByIdAndUpdate(user._id, {
			$push: { eventId: response._id },
		});

		console.log(response);

		if (!response) {
			return {
				status: false,
				message: "An error occurred while creating event.",
			};
		}

		return {
			status: true,
			message: "Event created successfully",
			data: response.data,
		};
	} catch (error) {
		console.error("Error creating event:", error);
		return {
			status: false,
			message: "An error occurred while creating event.",
		};
	}
};

export const getEvents = async (userId) => {
	try {
		const user = await UserModel.findOne({ _id: userId });
		if (!user) {
			return {
				status: false,
				message: "User not found",
			};
		}

		const response = await EventModel.find({ userId: user._id });

		if (!response) {
			return {
				status: false,
				message: "An error occurred while getting events.",
			};
		}

		return {
			status: true,
			message: "Events retrieved successfully",
			data: response,
		};
	} catch (error) {
		console.error("Error getting events:", error);
		return {
			status: false,
			message: "An error occurred while getting events.",
		};
	}
};

export const deleteEvent = async (userId, eventId) => {
	try {
		const user = await UserModel.findOne({ _id: userId });
		if (!user) {
			return {
				status: false,
				message: "User not found",
			};
		}
		await UserModel.findByIdAndUpdate(user._id, {
			$pull: { eventId: eventId },
		});

		const response = await EventModel.findOneAndDelete({
			userId: user._id,
			_id: eventId,
		});

		if (!response) {
			return {
				status: false,
				message: "An error occurred while deleting event.",
			};
		}

		return {
			status: true,
			message: "Event deleted successfully",
			data: response,
		};
	} catch (error) {
		console.error("Error deleting event:", error);
		return {
			status: false,
			message: "An error occurred while deleting event.",
		};
	}
};

export const getAllSheduledMeeting = async (userId) => {
	try {
		const user = await UserModel.findOne({ _id: userId });
		if (!user) {
			return {
				status: false,
				message: "User  not found",
			};
		}
		// console.log("userId", user._id);
		const response = await BookingModel.find({ userId: user._id })
			.populate("userId")
			.populate("eventId");

		// console.log("meetings", response);

		return {
			status: true,
			message: "Scheduled meetings retrieved successfully",
			data: response,
		};
	} catch (error) {
		console.error("Error getting scheduled meetings:", error);
		return {
			status: false,
			message: "An error occurred while getting scheduled meetings.",
		};
	}
};

export const cancelSheduledMeeting = async (userId, meetingId) => {
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

		const meeting = await BookingModel.findOne({
			_id: meetingId,
			userId: user._id,
		});
		const event = await EventModel.findOne({
			userId: user._id,
			bookings: meetingId,
		});
		if (!meeting) {
			return {
				status: false,
				message: "Meeting not found",
			};
		}

		// Cancel the meeting in Google Calendar
		const calendar = google.calendar({
			version: "v3",
			auth: oAuth2Client,
		});

		await calendar.events.delete({
			calendarId: "primary",
			eventId: meeting.googleEventId,
		});

		// Delete the meeting from the database
		await EventModel.findByIdAndUpdate(event._id, {
			$pull: { bookings: meetingId },
		});
		const response = await BookingModel.findOneAndDelete({
			_id: meetingId,
			userId: user._id,
		});

		return {
			status: true,
			message: "Scheduled meeting deleted successfully",
			data: response,
		};
	} catch (error) {
		console.error("Error cancelling scheduled meeting:", error);
		return {
			status: false,
			message: "An error occurred while cancelling scheduled meeting.",
		};
	}
};

// Unauthenticated route for scheduling meetings
export const scheduleMeeting = async (data) => {
	try {
		// console.log("data with Payment status", data);
		// Fetch the event data from the database
		const eventData = await EventModel.find({ _id: data.meetingData.eventId });
		// Fetch the user data from the database
		const user = await UserModel.findOne({
			userName: data.meetingData.username,
		});

		// console.log("user", user);

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

		// Get the current year
		const currentYear = new Date().getFullYear();

		// Helper function to create a full date string
		const createFullDateString = (dateString, timeString) => {
			return `${dateString} ${currentYear} ${timeString}`;
		};

		// Log the inputs
		// console.log("Date String:", data.meetingData.date);
		// console.log("Start Time String:", data.meetingData.startTime);
		// console.log("End Time String:", data.meetingData.endTime);

		// Create full date strings for the start and end times
		const startDateFull = createFullDateString(
			data.meetingData.date,
			data.meetingData.startTime
		);
		const endDateFull = createFullDateString(
			data.meetingData.date,
			data.meetingData.endTime
		);

		// Log the full date strings
		// console.log("Start Date Full String:", startDateFull);
		// console.log("End Date Full String:", endDateFull);

		// Parse the start and end date/time strings
		const parsedStartDate = parse(
			startDateFull,
			"MMMM dd yyyy HH:mm",
			new Date()
		);
		const parsedEndDate = parse(endDateFull, "MMMM dd yyyy HH:mm", new Date());

		// Check if parsed dates are valid
		if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
			throw new Error("Parsed date is invalid.");
		}

		// Format the start and end dates in the desired time zone
		const startDate = formatInTimeZone(
			parsedStartDate,
			"Asia/Kolkata",
			"yyyy-MM-dd'T'HH:mm:ss"
		);
		const endDate = formatInTimeZone(
			parsedEndDate,
			"Asia/Kolkata",
			"yyyy-MM-dd'T'HH:mm:ss"
		);

		// Create the event object for the Google Calendar API
		const event = {
			summary: eventData[0]?.title,
			description: data.additionalInfo,
			start: {
				dateTime: startDate,
				timeZone: "Asia/Kolkata",
			},
			end: {
				dateTime: endDate,
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

		// console.log("Access Token:", accessToken);
		// console.log("Refresh Token:", refreshToken);

		// Insert the event into the user's primary calendar
		const response = await calendar.events.insert({
			calendarId: "primary",
			requestBody: event,
			conferenceDataVersion: 1,
		});

		// Check if the hangout link is available in the response
		const hangoutLink = response.data.hangoutLink;
		if (!hangoutLink) {
			console.error("Hangout link not found in response.");
		}

		console.log("startDate:", startDate);
		console.log("endDate:", endDate);

		// Create a new meeting booking in the database
		const meeting = await BookingModel.create({
			userId: user._id,
			name: data.meetingData.name,
			email: data.meetingData.email,
			eventId: data.meetingData.eventId,
			startTime: startDate,
			endTime: endDate,
			additionalInfo: data.meetingData.additionalInfo,
			meetingLink: hangoutLink,
			googleEventId: response.data.id,
			title: eventData[0]?.title,
			date: data.meetingData.date,
			paymentStatus: data.meetingData.paymentStatus || "Not Required",
			paymentId: data.meetingData.paymentId || null,
			paymentAmount: data.meetingData.paymentAmount || 0,
		});

		console.log("Meeting created:", meeting);

		// Update the event model to include the new meeting ID in the bookings array
		await EventModel.findByIdAndUpdate(data.meetingData.eventId, {
			$push: { bookings: meeting._id },
		});
		console.log("Event updated:", eventData);

		// Return the successful response
		return {
			status: true,
			message: "Meeting scheduled successfully",
			data: meeting,
		};
	} catch (error) {
		console.error("Error scheduling meeting:", error);
		// Return an error response
		return {
			status: false,
			message: "An error occurred while scheduling the meeting.",
		};
	}
};

// Payment initiation before scheduling a meeting
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
export const createPaymentSession = async (data) => {
	try {
		// Generate order ID
		const orderId = await generateOrderId();
		// Generate a random customer ID
		const customerId = uuidv4();

		// Prepare request payload
		const request = {
			order_amount: parseFloat(data.paymentAmount).toFixed(2),
			order_currency: "INR",
			order_id: orderId,
			customer_details: {
				customer_id: customerId,
				customer_name: data.name.trim(),
				customer_email: data.email.toLowerCase().trim(),
				customer_phone: data.phoneNumber.trim(),
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
			data: response.data,
		};
	} catch (error) {
		console.error("Payment error:", error);
		return {
			status: false,
			data: {
				orderId: null,
				paymentSessionId: null,
				paymentLink: null,
				orderStatus: null,
				expiryTime: null,
			},
			error: error.message,
		};
	}
};

export const verifyPayment = async (req, res) => {
	try {
		const { orderId } = req.body;
		// Fetch payment details
		const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);

		// Validate response
		if (!response?.data) {
			throw new Error("Invalid response from payment gateway");
		}

		// Extract payment status
		const payment = response.data[0] || {};
		const paymentStatus = payment.payment_status?.toLowerCase();

		// Define valid payment statuses
		const validPaymentStatuses = ["success", "completed", "settled"];

		return {
			status: true,
			data: {
				orderId,
				paymentId: payment.cf_payment_id,
				amount: payment.payment_amount,
				currency: payment.payment_currency,
				status: paymentStatus,
				isPaymentSuccessful: validPaymentStatuses.includes(paymentStatus),
				paymentMethod: payment.payment_method,
				paymentTime: payment.payment_completion_time,
				refundStatus: payment.refund_status,
			},
		};
	} catch (error) {
		console.error("Payment error:", error);
		return {
			status: false,
			data: {
				orderId: null,
				paymentId: null,
				amount: null,
				currency: null,
				status: null,
				isPaymentSuccessful: false,
				paymentMethod: null,
				paymentTime: null,
				refundStatus: null,
			},
			error: error.message,
		};
	}
};

// Below Code Not Updated

// Unauthenticated route
// export const getSchedulePageData = async (username, eventId) => {
// 	try {
// 		// Find the user by username
// 		const user = await UserModel.findOne({ userName: username });

// 		// Check if user was found
// 		if (!user) {
// 			return {
// 				status: 404,
// 				message: "User  not found",
// 			};
// 		}

// 		// Find the user's availability
// 		const availability = await AvailabilityModel.findOne({ userId: user._id });

// 		// Check if availability was found
// 		if (!availability) {
// 			return {
// 				status: 404,
// 				message: "Availability not found for the user",
// 			};
// 		}

// 		// Find events associated with the user
// 		const events = await EventModel.find({ _id: eventId, userId: user._id });

// 		// Check if events were found
// 		if (!events || events.length === 0) {
// 			return {
// 				status: 404,
// 				message: "No events found for the user",
// 			};
// 		}

// 		// Return the gathered data
// 		return {
// 			status: 200,
// 			message: "Schedule page data retrieved successfully",
// 			data: {
// 				user: user,
// 				availability: availability,
// 				events: events,
// 			},
// 		};
// 	} catch (error) {
// 		console.error("Error getting schedule page data:", error);
// 		return {
// 			status: 500,
// 			message: "An error occurred while getting schedule page data.",
// 		};
// 	}
// };

// function convertToDateObject(dateString) {
// 	// Get current year
// 	const currentYear = new Date().getFullYear();

// 	// Parse the month and day
// 	const [month, day] = dateString.split(" ");

// 	// Create a mapping of month names to month indices
// 	const monthMap = {
// 		January: 0,
// 		February: 1,
// 		March: 2,
// 		April: 3,
// 		May: 4,
// 		June: 5,
// 		July: 6,
// 		August: 7,
// 		September: 8,
// 		October: 9,
// 		November: 10,
// 		December: 11,
// 	};

// 	// Convert month name to month index
// 	const monthIndex = monthMap[month];

// 	// Create and return the date object
// 	return new Date(currentYear, monthIndex, parseInt(day));
// }

// export const getEventsByUsername = async (username) => {
// 	try {
// 		const user = await UserModel.findOne({ userName: username });
// 		if (!user) {
// 			return {
// 				status: 404,
// 				message: "User  not found",
// 			};
// 		}
// 		const response = await EventModel.find({ userId: user._id });
// 		return {
// 			status: 200,
// 			message: "Events retrieved successfully",
// 			data: response,
// 		};
// 	} catch (error) {
// 		console.error("Error getting events by username:", error);
// 		return {
// 			status: 500,
// 			message: "An error occurred while getting events by username.",
// 		};
// 	}
// };

// export const getEventsByOnelink = async (onelinkId) => {
// 	try {
// 		const user = await UserModel.findOne({ oneLinkId: onelinkId });
// 		if (!user) {
// 			return {
// 				status: 404,
// 				message: "User  not found",
// 			};
// 		}
// 		// console.log("userId", user._id);
// 		const response = (await EventModel.find({ userId: user._id })).filter(
// 			(event) => event.eventType === "Pitch Day"
// 		);
// 		// console.log("Pitch Day Events", response);
// 		return {
// 			status: 200,
// 			message: "Events retrieved successfully",
// 			data: response,
// 		};
// 	} catch (error) {
// 		console.error("Error getting events by onelink:", error);
// 		return {
// 			status: 500,
// 			message: "An error occurred while getting events by onelink.",
// 		};
// 	}
// };
