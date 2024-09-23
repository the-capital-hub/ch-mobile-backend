import { Schema, model } from "mongoose";

const achievementSchema = new Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    badge: {
      type: String,
    },
  },
);

export const AchievementsModel = model("Achievement", achievementSchema);