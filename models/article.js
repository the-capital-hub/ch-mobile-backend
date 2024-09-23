import { Schema, model } from "mongoose";

const articleSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    content:{
        type:String
    }
  },
  {
    timestamps: true,
  }
);

export const ArticleModel = model("Article", articleSchema);
