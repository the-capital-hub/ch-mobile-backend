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
// import upload from "../utils/file.helper.js"
import multer from "multer";
const router = express.Router();

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

router.get("/getDocument", getDocumentList);
router.post("/uploadDocument", upload.single("file") , uploadDocumentController);
router.post("/getDocumentsByUser", getDocumentByUserController);
router.post("/createFolder", createFolderController);
router.get("/getFolderByUser/:oneLinkId", getFolderByUserController);
router.patch("/renameFolder", renameFolderController);
router.delete("/deleteFolder", deleteFolderController);
router.delete("/deleteDocument/:id", deleteDocumentController);

export default router;
