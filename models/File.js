import { Schema, model } from "mongoose";

const fileSchema = new Schema(
  {
    // originalname: { type: String, required: true },
    // mimetype: { type: String, required: true },
    // size: { type: Number, required: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    fileName: {
      type: String,
      required: true,
    },
    folderName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

const FileModel = model("Files", fileSchema);

export default FileModel;
