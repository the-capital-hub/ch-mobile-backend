import { QuestionModel } from "../models/Questions.js";
import { UserModel } from "../models/User.js";
import { StartUpModel } from "../models/startUp.js";
import { InvestorModel } from "../models/Investor.js";

export const createQuestions = async (questionsData) => {
  try {
    const question = new QuestionModel({
      ...questionsData
    });
    await question.save();
    return {
      status: 200,
      message: "Question Added",
      data: question,
    }
  } catch (error) {
    console.error("Error creating question:", error);
    return {
      status: 500,
      message: "An error occurred while creating question.",
    };
  }
}

function getEmptyFields(data) {
  const emptyFields = [];
  if (data && Object.keys(data).length > 0) {
    for (const key in data) {
      if (!data[key] || (Array.isArray(data[key]) && data[key].length === 0)) {
        emptyFields.push(key);
      }
    }
  }
  return emptyFields;
}

export const getUnansweredQuestion = async (userId, questionType) => {
  try {
    let question;
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      };
    }
    if (questionType === "Personal") {
      const emptyFields = getEmptyFields(user);
      question = await QuestionModel.findOne({ type: "Personal", fieldName: { $in: emptyFields } });
    } else if (questionType === "Startup") {
      if (user.startUp) {
        const startup = await StartUpModel.findById(user.startUp);
        const userEmptyFields = getEmptyFields(user);
        const emptyFields = getEmptyFields(startup);
        question = await QuestionModel.findOne({ type: "Startup", fieldName: { $in: emptyFields.concat(userEmptyFields) } });
      }
    } else if (questionType === "Investor") {
      if (user.investor) {
        const investor = await InvestorModel.findById(user.investor);
        const userEmptyFields = getEmptyFields(user);
        const emptyFields = getEmptyFields(investor);
        question = await QuestionModel.findOne({ type: "Investor", fieldName: { $in: emptyFields.concat(userEmptyFields) } });
      }
    }
    if (!question) {
      return {
        status: 200,
        message: "Thank you, You have answered all the questions",
        data: null,
      };
    }
    return {
      status: 200,
      message: "Question retrieved successfully.",
      data: question,
    };
  } catch (error) {
    console.error("Error retrieving unanswered question:", error);
    return {
      status: 500,
      message: "An error occurred while retrieving unanswered question.",
    };
  }
};

export const answerQuestion = async (questionId, answer, userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      };
    }
    const question = await QuestionModel.findById(questionId);
    if (!question) {
      return {
        status: 404,
        message: "Question not found.",
      };
    }
    if (question.schema === "user") {
      user[question.fieldName] = answer;
      await user.save();
    } else if (question.schema === "startup") {
      const startup = await StartUpModel.findById(user.startUp);
      startup[question.fieldName] = answer;
      await startup.save();
    } else if (question.schema === "investor") {
      const investor = await InvestorModel.findById(user.investor);
      investor[question.fieldName] = answer;
      await investor.save();
    }
    return {
      status: 200,
      message: "Question answered successfully.",
      data: question,
    };
  } catch (error) {
    console.error("Error answering question:", error);
    return {
      status: 500,
      message: "An error occurred while  answering question.",
    };
  }
}

export const getUnansweredQuestionCount = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      };
    }
    let companyQuestionCount = 0;
    const emptyFields = getEmptyFields(user);
    const personalQuestionCount = await QuestionModel.countDocuments({ type: "Personal", fieldName: { $in: emptyFields } });
    if (user.isInvestor === "true") {
      const investor = await InvestorModel.findById(user.investor);
      const companyEmptyField = getEmptyFields(investor);
      companyQuestionCount = await QuestionModel.countDocuments({ type: "Investor", fieldName: { $in: emptyFields.concat(companyEmptyField) } });
    } else {
      const startup = await StartUpModel.findById(user.startUp);
      const companyEmptyField = getEmptyFields(startup);
      companyQuestionCount = await QuestionModel.countDocuments({ type: "Startup", fieldName: { $in: emptyFields.concat(companyEmptyField) } });
    }
    return {
      status: 200,
      message: "Questions Count retrived successfully",
      data: {
        personalQuestionCount,
        companyQuestionCount,
        total: personalQuestionCount + companyQuestionCount
      }
    }
  } catch (error) {
    console.error("Error getting question count:", error);
    return {
      status: 500,
      message: "An error occurred while getting question count.",
    };
  }
}