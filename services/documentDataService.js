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
        status: true,
        message: "Folder Already Exists",
      };
    }
    const folder = new Folder({
      userId: userId,
      folderName: folderName,
    });
    await folder.save();
    return {
      status: true,
      message: "Folder Created",
      data: folder
    };
  } catch (error) {
    console.error("Error creating folder:", error);
    return {
      status: false,
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
      status: true,
      message: "Folder Created",
      data: allFolderNames,
    };
  } catch (error) {
    console.error("Error getting folders:", error);
    return {
      status: false,
      message: "An error occurred while getting folders.",
    };
  }
};


export const uploadDocument = async (file, userId, folderName) => {
  try {
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(file.base64Data, 'base64');
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.originalname}`;

    const fileObject = {
      buffer: fileBuffer,
      mimeType: getMimeType(file.originalname), 
      originalname: file.originalname,
    };

    // Upload to Google Drive
    const driveResponse = await uploadFileToDrive(fileObject, fileName);

    if (!driveResponse.webViewLink) {
      throw new Error("Google Drive response does not contain webViewLink");
    }

    // Save file metadata to database
    const newFile = new FileModel({
      userId: userId,
      fileName: fileName,
      folderName: folderName,
      fileUrl: driveResponse.webViewLink,
    });

    await newFile.save();

    const files = await File.find({ userId: userId, folderName: folderName });
    
    // Transform files only if they exist
    const transformedFiles = files?.map(file => ({
      _id: file._id,
      userId: file.userId,
      fileName: file.fileName,
      folderName: file.folderName,
      fileUrl: file.fileUrl,
      extension: file.fileName.split('.').pop().toLowerCase()
    }));

    return {
      status: true,
      message: "Files Uploaded successfully",
      data: transformedFiles
    };

  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      status: false,
      message: `Error uploading document ${file.originalname}`,
      error: error.message
    };
  }
};

// Helper function to determine MIME type based on file extension
const getMimeType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'pdf': 'application/pdf',
    // Add more as needed
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

export const getDocumentByUser = async (userId, folder_name) => {
  try {
    const files = await File.find({ userId: userId, folderName: folder_name });
    if (!files) {
      return {
        status: false,
        message: "Document not found.",
      };
    }

    const transformedFiles = files.map(file => {
      const extension = file.fileName.split('.').pop().toLowerCase();
      
      return {
        _id: file._id,
        userId: file.userId,
        fileName: file.fileName,
        folderName: file.folderName,
        fileUrl: file.fileUrl,
        extension: extension
      };
    });

    return {
      status: true,
      message: "Documents details retrieved successfully.",
      data: transformedFiles,
    };
  } catch (error) {
    console.error("Error getting document:", error);
    return {
      status: false,
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
        status: false,
        message: "Folder not found.",
      };
    }

    folder.folderName = newFolderName;
    await folder.save();

    return {
      status: true,
      message: "Folder renamed successfully.",
      data: folder,
    };
  } catch (error) {
    console.error("Error renaming folder:", error);
    return {
      status: false,
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
        status: false,
        message: "Folder not found.",
      };
    }

    await File.deleteMany({ folderId: folderId });
    await Folder.deleteOne({ _id: folder._id });
    return {
      status: true,
      message: "Folder deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return {
      status: false,
      message: "An error occurred while deleting the folder.",
    };
  }
};

export const deleteDocument = async (documentId, userId, folder_name) => {
  try {
    const document = await File.findOne({ _id: documentId });
    if (!document) {
      return {
        status: false,
        message: "Document not found.",
      };
    }
    await File.deleteOne({ _id: document._id });
    const files = await File.find({ userId: userId, folderName: folder_name });
    if (!files) {
      return {
        status: true,
        message: "Document deleted but no files do display.",
      };
    }

    const transformedFiles = files.map(file => {
      const extension = file.fileName.split('.').pop().toLowerCase();
      
      return {
        _id: file._id,
        userId: file.userId,
        fileName: file.fileName,
        folderName: file.folderName,
        fileUrl: file.fileUrl,
        extension: extension
      };
    });

    return {
      status: true,
      message: "Documents deleted successfully.",
      data: transformedFiles,
    };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      status: false,
      message: "An error occurred while deleting the document.",
    };
  }
};
