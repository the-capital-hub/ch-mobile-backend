import express from "express";
import { create_subscription, get_subscription_plan, update_plan_status } from "../controllers/subscriptionController.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
import { checkSubscription } from "../middlewares/checkSubscription.js";

const router = express.Router();

router.use(authenticateToken);
router.post("/create_subscription",create_subscription);
router.post("/get_subscription",get_subscription_plan);
router.put("/update_plan_status",update_plan_status)

router.get('/protected-endpoint', checkSubscription, (req, res) => {
    res.json({ message: 'You have access to this protected route.' });
});

export default router;
