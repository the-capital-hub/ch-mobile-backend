import express from "express";
import { contactUsController, lookingForFundingMailController } from "../controllers/contactUsController.js";

const router = express.Router();

router.post("/", contactUsController);
router.post("/lookingForFundingMail", lookingForFundingMailController);

export default router;