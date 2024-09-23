import { Schema, model } from "mongoose";

const chatSchema = new Schema(
  {
    members: [
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

export const ChatModel = model("Chats", chatSchema);