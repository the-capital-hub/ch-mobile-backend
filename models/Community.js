import { Schema, model } from "mongoose";

const communitySchema = new Schema(
  {
    profileImage: {
      type: String
    },
    communityName: {
      type: String,
    },
    about: {
      type: String,
    },
    adminId: {
      type: Schema.Types.ObjectId,
        ref: "Users",
    },
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

export const CommunityModel = model("Community", communitySchema);