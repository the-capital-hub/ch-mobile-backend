import mongoose, { Schema, model } from "mongoose";

const availabilitySchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "Users",
		},
		dayAvailability: [
			{
				_id: false,
				day: {
					type: String,
					enum: [
						"monday",
						"tuesday",
						"wednesday",
						"thursday",
						"friday",
						"saturday",
						"sunday",
					],
				},
				startTime: {
					type: String,
				},
				endTime: {
					type: String,
				},
				// enabled: {
				// 	type: Boolean,
				// },
			},
		],
		minimumGap: {
			type: Number,
		},
	},
	{
		timestamps: true,
	}
);

export const AvailabilityModel = model("Availability", availabilitySchema);
