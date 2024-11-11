import express from "express";
import {
  uploadDocumentController,
  createFolderController,
  getFolderByUserController,
  getDocumentByUserController,
  getDocumentList,
  deleteFolderController,
  renameFolderController,
  deleteDocumentController,
} from "../controllers/documentDataController.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = express.Router();

router.get("/getDocument", getDocumentList);
router.post("/uploadDocument", authenticateToken, uploadDocumentController);
router.post("/getDocumentsByUser", getDocumentByUserController);
router.post("/createFolder", createFolderController);
router.get("/getFolderByUser/:oneLinkId", getFolderByUserController);
router.patch("/renameFolder", renameFolderController);
router.delete("/deleteFolder", deleteFolderController);
router.delete("/deleteDocument/:id", deleteDocumentController);

export default router;
