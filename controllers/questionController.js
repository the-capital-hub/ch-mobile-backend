import {
  createQuestions,
  getUnansweredQuestion,
  answerQuestion,
  getUnansweredQuestionCount,
} from "../services/questionService.js";

export const createQuestionsController = async (req, res) => {
  try {
    const response = await createQuestions(req.body);
    res.status(response.status).send(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while creating questions.",
    });
  }
};

export const getUnansweredQuestionController = async (req, res) => {
  try {
    const userId = req.userId;
    const { questionType } = req.params;
    const response = await getUnansweredQuestion(userId, questionType);
    res.status(response.status).send(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while getting questions.",
    });
  }
};

export const answerQuestionController = async (req, res) => {
  try {
    const userId = req.userId;
    const { answer, questionId } = req.body;
    const response = await answerQuestion(questionId, answer, userId);
    res.status(response.status).send(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while answering questions.",
    });
  }
};

export const getUnansweredQuestionCountController = async (req, res) => {
  try {
    const userId = req.userId;
    const response = await getUnansweredQuestionCount(userId);
    res.status(response.status).send(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while getting questions count.",
    });
  }
};