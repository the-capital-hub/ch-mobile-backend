import { Schema, model } from "mongoose";

const milestoneSchema = new Schema(
  {
    text: {
      type: String,
    },
    badge: {
      type: String,
    },
  },
);

export const MilestoneModel = model("Milestones", milestoneSchema);