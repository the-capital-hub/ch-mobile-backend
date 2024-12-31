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
    const { chatId , sender_id, attachment_type, text, attachment_url } = req.body;

    // Generate a random ID for the message
    let id = generateRandomId(); // You need to implement this function

    let documentName, documentUrl, image, video;

    
    if (attachment_type === 'text') {
      // Only text is provided
      text = text || '';
    } else if (attachment_type === 'image') {
      image = attachment_url;
    } else if (attachment_type === 'document') {
      documentUrl = attachment_url;
      documentName = attachment_url.split('/').pop(); 
    } else if (attachment_type === 'video') {
      video = attachment_url;
    }

    const response = await addMessage(id, chatId, sender_id, text, documentName, documentUrl, image, video);
    return res.send(response);
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: "An error occurred while adding message.",
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
  const {userId} = req.body;
  const response = await clearChat(chatId, userId);
  return res.status(response.status).send(response);
} catch (error) {
  console.error(error, error.message);
  return res.status(500).send({
    status: 500,
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
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
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
