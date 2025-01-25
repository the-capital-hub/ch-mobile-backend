import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Users",
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
		},
		eventType: {
			type: String,
			enum: ["Public", "Private", "Pitch Day"],
			default: "Public",
		},
		bookings: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Bookings",
			},
		],
		price: {
			type: Number,
			default: 0,
		},
		discount: {
			type: Number,
			default: 0,
		},
		communityId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "NewCommunities",
		},
	},
	{
		timestamps: true,
	}
);

export const EventModel = mongoose.model("Events", eventSchema);
