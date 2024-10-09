import express from "express";

import { getVcController } from "../controllers/vcController.js";

const router = express.Router();

router.post('/getVcById', getVcController);

export default router;