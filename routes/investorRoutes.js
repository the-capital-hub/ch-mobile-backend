import express from "express";
import {
  createInvestorController,
  addSectorOfInterestController,
  addStartupInvestedController,
  getInvestorByIdController,
  uploadLogoController,
  addMyInterestController,
  getOnePagerController,
  getInvestorBySearchController,
  addPastInvestmentsController,
} from "../controllers/investorController.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

router.post("/createInvestor", createInvestorController);

router.use(authenticateToken);

router.patch("/addSectorOfInterest/:investorId", addSectorOfInterestController);
router.patch("/addStartupInvested/:investorId", addStartupInvestedController);
router.patch("/addPastInvestmentsController/:investorId", addPastInvestmentsController);
router.get("/getInvestorById/:investorId", getInvestorByIdController);
router.post("/uploadLogo", uploadLogoController);
router.patch("/addMyInterest/:investorId", addMyInterestController);
router.get("/getOnePager/:oneLink/:oneLinkId", getOnePagerController);
router.get("/searchInvestors/:searchQuery", getInvestorBySearchController);

export default router;