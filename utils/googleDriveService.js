import fs from "fs/promises";
import { google } from "googleapis";
import stream from 'stream';
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";
import { Readable } from 'stream';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

const credentials = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
};


// const SERVICE_ACCOUNT_KEY_FILE = path.join(_dirname, "credForDocUpload.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

const setFilePermissions = async (fileId) => {
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
    console.log(`Permissions set to anyone with the link for file ID: ${fileId}`);
  } catch (error) {
    console.error("Error setting file permissions:", error);
    throw error;
  }
};

// Add this constant near the top with other constants
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export const uploadFileToDrive = async (fileObject, fileName) => {
  try {
    // Use the existing drive instance instead of getting a new one
    const fileMetadata = {
      name: fileName,
      parents: [GOOGLE_DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: fileObject.mimeType,
      body: Readable.from(fileObject.buffer)
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,webViewLink'
    });

    // Set file permissions to anyone with the link can view
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    console.log(`Permissions set to anyone with the link for file ID: ${file.data.id}`);

    return {
      fileId: file.data.id,
      webViewLink: file.data.webViewLink
    };
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw error;
  }
};
