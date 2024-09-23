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

export const addMessageController = async (req, res) => {
  try {
    const { id, chatId, senderId, text, documentName, documentUrl, image, video } = req.body;
    const response = await addMessage(id, chatId, senderId, text, documentName, documentUrl, image, video);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while adding message.",
    });
  }
};

export const getMessagesController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const {currentUserId} = req.body;
    const response = await getMessages(chatId, currentUserId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
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
