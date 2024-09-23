import { Schema, model } from "mongoose";

const folderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    folderName: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const FolderModel = model("Folders", folderSchema);

export default FolderModel;
