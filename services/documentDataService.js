import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import File from "../models/File.js";
import Folder from "../models/Folder.js";
import { UserModel } from "../models/User.js";
//import { cloudinary } from "../utils/uploadImage.js";
import { uploadFileToDrive } from "../utils/googleDriveService.js";
import FileModel from "../models/File.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Function to get a list of files in the upload directory along with their names
export const getDocumentList = () => {
  const uploadDir = path.join(__dirname, "..", "uploads");
  // const uploadDir = path.join(__dirname, "..", "uploads/"+ userId + "/" + folderId);

  try {
    const files = fs.readdirSync(uploadDir).map((file) => {
      const filePath = path.join(uploadDir, file);
      const fileData = fs.readFileSync(filePath, "utf-8"); // Assuming files are text-based, change 'utf-8' if needed
      return { name: file, data: fileData };
    });
    return files;
  } catch (error) {
    console.error("Error reading upload directory:", error);
    return [];
  }
};


export const createFolder = async (args) => {
  try {
    const { userId, folderName } = args;

    const folderExists = await Folder.findOne({ userId: userId, folderName: folderName });
    if (folderExists) {
      return {
        status: 200,
        message: "Folder Already Exists",
      };
    }
    const folder = new Folder({
      userId: userId,
      folderName: folderName,
    });
    await folder.save();
    return {
      status: 200,
      message: "Folder Created",
      data: folder
    };
  } catch (error) {
    console.error("Error creating folder:", error);
    return {
      status: 500,
      message: "An error occurred while creating folder.",
    };
  }
};

export const getFolderByUser = async (oneLinkId) => {
  try {
    const user = await UserModel.findOne({ oneLinkId: oneLinkId });
    const files = await File.find({ userId: user._id });
    const folders = Array.from(new Set(files.map(files => files.folderName)));
    const defaultFolderNames = ["pitchdeck", "business", "kycdetails", "legal and compliance"];
    const allFolderNamesSet = new Set([...defaultFolderNames, ...folders]);
    const allFolderNames = [...allFolderNamesSet];
    return {
      status: 200,
      message: "Folder Created",
      data: allFolderNames,
    };
  } catch (error) {
    console.error("Error getting folders:", error);
    return {
      status: 500,
      message: "An error occurred while getting folders.",
    };
  }
};


export const uploadDocument = async (file, userId, folderName) => {
  try {
     //make file ready to upload
     const fileBuffer = await fs.readFile(file.path);
     const timestamp = Date.now();
     const fileName = `${timestamp}_${file.originalname}`;

     const fileObject = {
      buffer: fileBuffer,
      mimeType: file.mimetype,
      originalname: file.originalname,
    };

    const driveResponse = await uploadFileToDrive(fileObject, fileName);


     // Check if driveResponse contains webViewLink
    if (!driveResponse.webViewLink) {
      throw new Error("Google Drive response does not contain webViewLink");
    }
 
     const newFile = new FileModel({
       userId: userId,
       fileName: fileName,
       folderName: folderName,
       fileUrl: driveResponse.webViewLink,
     });
 
     await newFile.save();

    return {
      status: 200,
      message: "File uploaded successfully",
      file: newFile,
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    throw new Error("Error uploading document");
  }
};




export const getDocumentByUser = async (args) => {
  try {
    const { oneLinkId, folderName } = args;
    const user = await UserModel.findOne({ oneLinkId: oneLinkId });
    const file = await File.find({ userId: user._id, folderName: folderName });
    if (!file) {
      return {
        status: 404,
        message: "Document not found.",
      };
    }
    return {
      status: 200,
      message: "Documents details retrieved successfully.",
      data: file,
    };
  } catch (error) {
    console.error("Error getting document:", error);
    return {
      status: 500,
      message: "An error occurred while getting documents.",
    };
  }
};

export const renameFolder = async (args) => {
  try {
    const { folderId, newFolderName } = args;
    const folder = await Folder.findOne({ _id: folderId });

    if (!folder) {
      return {
        status: 404,
        message: "Folder not found.",
      };
    }

    folder.folderName = newFolderName;
    await folder.save();

    return {
      status: 200,
      message: "Folder renamed successfully.",
      data: folder,
    };
  } catch (error) {
    console.error("Error renaming folder:", error);
    return {
      status: 500,
      message: "An error occurred while renaming the folder.",
    };
  }
};


export const deleteFolder = async (args) => {
  try {
    const { folderId } = args;
    const folder = await Folder.findOne({ _id: folderId });
    if (!folder) {
      return {
        status: 404,
        message: "Folder not found.",
      };
    }

    await File.deleteMany({ folderId: folderId });
    await Folder.deleteOne({ _id: folder._id });
    return {
      status: 200,
      message: "Folder deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return {
      status: 500,
      message: "An error occurred while deleting the folder.",
    };
  }
};

export const deleteDocument = async (documentId) => {
  try {
    const document = await File.findOne({ _id: documentId });
    if (!document) {
      return {
        status: 404,
        message: "Document not found.",
      };
    }
    await File.deleteOne({ _id: document._id });
    return {
      status: 200,
      message: "Document deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      status: 500,
      message: "An error occurred while deleting the document.",
    };
  }
};
