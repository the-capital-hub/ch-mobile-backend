import express from "express";
import {
  createQuestionsController,
  getUnansweredQuestionController,
  answerQuestionController,
  getUnansweredQuestionCountController,
} from "../controllers/questionController.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

router.post("/createQuestion", createQuestionsController);

router.use(authenticateToken);

//get unanswered questions
router.get("/getQuestions/:questionType", getUnansweredQuestionController);
router.post("/answerQuestion", answerQuestionController);
router.get("/getQuestionCount", getUnansweredQuestionCountController);

export default router;