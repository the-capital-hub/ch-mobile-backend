import express from "express";

import { authenticateToken } from "../middlewares/authenticateToken.js";

import {
	createWebinarController,
	getWebinarController,
	deleteWebinarController,
	// getWebinarOnelinkIdController,
	// createPaymentSessionController,
	// paymentVerifyController,
} from "../controllers/webinarController.js";

const router = express.Router();

// http://localhost:8080/webinars
// Unauthorized routes
// router.get("/getWebinarsByOnelinkId/:onelinkId", getWebinarOnelinkIdController);

// payments routes to join a webinar
// router.post("/createPaymentSession", createPaymentSessionController);
// router.post("/verifyPayment", paymentVerifyController);

// Authorized routes below
router.use(authenticateToken);
router.post("/createWebinar", createWebinarController);
router.get("/getWebinars", getWebinarController);
router.delete("/deleteWebinar/:id", deleteWebinarController);

export default router;
