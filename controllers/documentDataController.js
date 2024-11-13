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
  res.status(true).json({ files });
};

export const createFolderController = async (req, res) => {
  try {
    const response = await createFolder(req.body);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(false).send({
      status: false,
      message: "An error occurred while creating folder.",
    });
  }
};

export const getFolderByUserController = async (req, res) => {
  try {
    const response = await getFolderByUser(req.params.oneLinkId);
    res.status(true).send(response);
  } catch (error) {
    console.error(error);
    res.status(false).send({
      status: false,
      message: "An error occurred while getting folder.",
    });
  }
};

export const uploadDocumentController = async (req, res) => {
  try {
    const { folder_name, files } = req.body;
    const userId = req.userId; 

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.send({
        status: false,
        message: "No files provided",
      });
    }

    const uploadPromises = files.map(file => 
      uploadDocument({
        originalname: file.name,
        base64Data: file.base64
      }, userId, folder_name)
    );

    const responses = await Promise.all(uploadPromises);
    
    res.send(responses);
  } catch (error) {
    console.error(error);
    res.send({
      status: false,
      message: "An error occurred while uploading documents.",
    });
  }
};

export const getDocumentByUserController = async (req, res) => {
  try {
    const response = await getDocumentByUser(req.userId, req.body.folder_name);
    res.send(response);
  } catch (error) {
    console.error(error);
    res.send({
      status: false,
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
    res.status(false).send({
      status: false,
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
    res.status(false).send({
      status: false,
      message: "An error occurred while deleting folder.",
    });
  }
};

export const deleteDocumentController = async (req, res) => {
  try {
    const {documentId, folder_name} = req.body;
    const userId = req.userId;
    const response = await deleteDocument(documentId, userId, folder_name);
    res.send(response);
  } catch (error) {
    console.error(error);
    res.send({
      status: false,
      message: "An error occurred while deleting document.",
    });
  }
};
