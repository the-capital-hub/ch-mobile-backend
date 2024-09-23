import { Schema, model } from "mongoose";

const liveDealsSchema = new Schema(
  {
    startupId: {
      type: Schema.Types.ObjectId,
      ref: "StartUps",
      required: true,
    },
    intrustedInvestor: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const LiveDealsModel = model("Livedeals", liveDealsSchema);