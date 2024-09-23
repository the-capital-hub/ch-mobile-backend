import express from "express";
import { addArticle } from "../controllers/articleController.js";

import { authenticateToken } from "../middlewares/authenticateToken.js";
const router = express.Router();

router.use(authenticateToken);

router.post("/add_article",addArticle)

export default router;