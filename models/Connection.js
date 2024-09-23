import { Schema, model } from "mongoose";

const connectionSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const ConnectionModel = model("Connections", connectionSchema);