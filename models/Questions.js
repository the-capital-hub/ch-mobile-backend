import { Schema, model } from "mongoose";

const questionSchema = new Schema({
  question: {
    type: String,
    required: true,
  },
  fieldName: {
    type: String,
    required: true,
  },
  schema: {
    type: String,
    required: true,
  },
  // Type can be 'Personal', 'Investor', 'Startup'
  type: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
    },
  ],
  isMultipleOption: {
    type: Boolean,
    default: false,
  }
});

export const QuestionModel = model("Questions", questionSchema);
