import { Schema, model } from "mongoose";

const scheduleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    start: {
      type: Date,
    },
    end: {
      type: Date,
    },
    title: {
      type: String,
    },
    doc: { type: String },
    agenda: {
      type: String,
    },
    meetingLink:{
      type:String
    }
  },
  {
    timestamps: true,
  }
);

export const ScheduleModel = model("Schedule", scheduleSchema);
