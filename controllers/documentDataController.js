import { getDocumentList as getAllDocumentList } from "../services/documentDataService.js";
import {
  uploadDocument,
  getDocumentByUser,
  createFolder,
  getFolderByUser,
  renameFolder,
  deleteFolder,
  deleteDocument
} from "../services/documentDataService.js";
// Controller function to get a list of uploaded files and their names
export const getDocumentList = (req, res) => {
  const files = getAllDocumentList(req.body.userId, req.body.folderId);
  res.status(200).json({ files });
};

export const createFolderController = async (req, res) => {
  try {
    const response = await createFolder(req.body);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while creating folder.",
    });
  }
};

export const getFolderByUserController = async (req, res) => {
  try {
    const response = await getFolderByUser(req.params.oneLinkId);
    res.status(200).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while getting folder.",
    });
  }
};

export const uploadDocumentController = async (req, res) => {
  try {
        const { userId, folderName } = req.body;
    const file = req.file; // Assuming you are using multer to handle file upload
    console.log(file)
    const response = await uploadDocument(file, userId, folderName);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while uploading documents.",
    });
  }
};

export const getDocumentByUserController = async (req, res) => {
  try {
    const response = await getDocumentByUser(req.body);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while getting documents.",
    });
  }
};

export const renameFolderController = async (req, res) => {
  try {
    const response = await renameFolder(req.body);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while renaming folder.",
    });
  }
};

export const deleteFolderController = async (req, res) => {
  try {
    const response = await deleteFolder(req.body);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while deleting folder.",
    });
  }
};

export const deleteDocumentController = async (req, res) => {
  try {
    const documentId = req.params.id;
    const response = await deleteDocument(documentId);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while deleting document.",
    });
  }
};
