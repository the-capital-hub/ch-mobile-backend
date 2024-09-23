import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },

  sender: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    // required: true,
  },

  type: {
    type: String,
    enum: ["connectionRequest", "connectionAccepted", "postLiked", "postShared", "postCommented", "meetingRequest", "achievementCompleted","onlinkRequest"],
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Posts",
  },
  connection: {
    type: Schema.Types.ObjectId,
    ref: "Connections",
  },
  meetingId: {
    type: Schema.Types.ObjectId,
    ref: "Schedule",
  },
  achievementId: {
    type: Schema.Types.ObjectId,
    ref: "Achievement",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

export const NotificationModel = model("Notifications", notificationSchema);