import {
  addMessage,
  getMessages,
  markMessagesAsRead,
  getUnreadMessageCount,
  clearAllMessages,
  clearChat,
  getAllUnreadMessageCountsForUser,
  deleteMessage,
  markMessagesAsReadInCommunities,
  getUnreadMessageCountInCommunities,
  getLastMessage,
} from "../services/messageService.js";

// Generate a random 8-character ID for messages (letters and numbers)
const generateRandomId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const addMessageController = async (req, res) => {
  try {
    const { chatId, attachment_type, text, attachment_url } = req.body;
    let id = generateRandomId();
    let documentName, documentUrl, image, video;

    if (attachment_url) {
      // Add appropriate data URI prefix based on attachment type
      if (attachment_type === 'image') {
        image = `data:image/png;base64,${attachment_url}`;
      } else if (attachment_type === 'document') {
        documentUrl = `data:application/pdf;base64,${attachment_url}`;
        documentName = attachment_url.split('/').pop();
      } else if (attachment_type === 'video') {
        video = `data:video/mp4;base64,${attachment_url}`;
      }
    }

    const response = await addMessage(id, chatId, req.userId, text, documentName, documentUrl, image, video);
    return res.send(response);
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: error,
    });
  }
};

export const getMessagesController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;
    const response = await getMessages(chatId, userId);
    return res.send(response);
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: "An error occurred while getting messages.",
    });
  }
};

export const clearChatController = async (req,res) => {

  try{
    const {chatId} = req.params;
  const userId = req.userId;
  const response = await clearChat(chatId, userId);
  return res.send(response);
} catch (error) {
  console.error(error, error.message);
  return res.send({
    status: false,
    message: "An error occurred while clearing messages.",
  });
}
}


export const markMessagesAsReadController = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const response = await markMessagesAsRead(chatId, userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while marking messages as read.",
    });
  }
};

export const getUnreadMessageCountController = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const response = await getUnreadMessageCount(chatId, userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting unread message count.",
    });
  }
};

export const clearAllMessagesController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const response = await clearAllMessages(chatId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while clearing messages.",
    });
  }
};

export const deleteMessageController = async (req, res) => {
  try {
    const { messageId } = req.params;
    const response = await deleteMessage(messageId);
    return res.send(response);
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: "An error occurred while deleting messages.",
    });
  }
};

export const markMessagesAsReadInCommunitiesController = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const response = await markMessagesAsReadInCommunities(chatId, userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while marking messages as read by communities.",
    });
  }
};

export const getUnreadMessageCountInCommunitiesController = async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    let response;

    if(chatId){
      // Fetch unread count for a specific chat
      response = await getUnreadMessageCountInCommunities(chatId, userId);
    } else {
      // Fetch unread count for all chats of the user
      response = await getAllUnreadMessageCountsForUser(userId);
      console.log("calling controller getAllUnreadMessageCountsForUser");
    }
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting unread message count.",
    });
  }
};

export const getLastMessageController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const response = await getLastMessage(chatId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting the last message.",
    });
  }
};
