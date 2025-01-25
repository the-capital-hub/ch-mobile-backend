import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Users",
		},
		eventId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Events",
		},
		name: {
			type: String,
		},
		email: {
			type: String,
		},
		additionalInfo: {
			type: String,
		},
		startTime: {
			type: String,
		},
		endTime: {
			type: String,
		},
		meetingLink: {
			type: String,
		},
		googleEventId: {
			type: String,
		},
		title: {
			type: String,
		},
		date: {
			type: Date,
		},
		paymentStatus: {
			type: String,
			enum: ["Paid", "Not Paid", "Failed", "Not Required"],
			default: "Not Required",
		},
		paymentId: {
			type: String,
			default: null,
		},
		paymentAmount: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

export const BookingModel = mongoose.model("Bookings", bookingSchema);
