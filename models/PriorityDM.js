import mongoose from "mongoose";

const prioritySchema = new mongoose.Schema(
	{
		founderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Users",
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Users",
		},
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		mobile: {
			type: String,
			required: true,
		},
		question: {
			type: String,
			required: true,
		},
		answer: {
			type: String,
		},
		isAnswered: {
			type: Boolean,
			default: false,
		},
		payment: {
			paymentId: String,
			orderId: String,
			status: String,
			amount: Number,
			paymentTime: Date,
		},
	},
	{
		timestamps: true,
	}
);

export const PriorityModel = mongoose.model("PriorityDM", prioritySchema);
