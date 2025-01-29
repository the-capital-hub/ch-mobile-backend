import express from "express";
import { authenticateToken } from "../middlewares/authenticateToken.js";

import {
	createPaymentSessionController,
	paymentVerifyController,
	getPriorityDMForUserController,
	getPriorityDMForFounderController,
	updatePriorityDMController,
	getPriorityDMByIdController,
} from "../controllers/priorityDMController.js";

const router = express.Router();
// http://localhost:8080/priorityDM/
// payments routes
router.post("/createPaymentSession", createPaymentSessionController);
router.post("/verifyPayment", paymentVerifyController);

// Authorized routes below
router.use(authenticateToken);
router.get("/getPriority-DMForUser", getPriorityDMForUserController);
router.get("/getPriority-DMForFounder", getPriorityDMForFounderController);

router.get("/getPriorityDMById/:questionId", getPriorityDMByIdController);
router.patch("/updatePriority-DM/:priorityDMId", updatePriorityDMController);

export default router;
