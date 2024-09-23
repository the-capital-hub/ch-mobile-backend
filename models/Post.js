import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    text: String,
    likes: [
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

const postSchema = new Schema(
  {
    category: {
      type: String,
      // required: true,
    },
    description: String,
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    image: String,
    images: {
      type: Array,
    },
    video: String,
    documentName: String,
    documentUrl: String,
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    comments: [commentSchema],
    resharedPostId: {
      type: Schema.Types.ObjectId,
      ref: "Posts",
    },
    resharedCount: {
      type: Number,
    },
    postType:{
      type:String
    }
  },
  {
    timestamps: true,
  }
);

export const PostModel = model("Posts", postSchema);
