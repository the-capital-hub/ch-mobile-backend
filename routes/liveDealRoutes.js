import express from "express";
import { addLiveDeal, add_to_live_deals, get_live_deal } from "../controllers/liveDealsControllers.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

router.post("/add_to_live_deals", addLiveDeal);
router.get("/get_live_deals",get_live_deal);
router.use(authenticateToken);
router.post("/add_investor_to_live_deal",add_to_live_deals)

export default router;