import {
  createChat,
  getUserChats,
  findChat,
  togglePinChat,
  getPinnedChats,
  getChatSettings,
  getAllChats,
} from "../services/chatService.js";

export const createChatController = async (req, res) => {
  try {
    const { senderId, recieverId } = req.body;
    const response = await createChat(senderId, recieverId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while creating chat.",
    });
  }
};

export const getUserChatsController = async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await getUserChats(userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting user chats.",
    });
  }
};

export const findChatController = async (req, res) => {
  try {
    const { firstId, secondId } = req.params;
    const response = await findChat(firstId, secondId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while finding the chat.",
    });
  }
};

export const togglePinChatController = async (req, res) => {
  try {
    const { userId, chatId } = req.params;
    const response = await togglePinChat(userId, chatId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while pinning/unpinning the chat.",
    });
  }
};

export const getPinnedChatsController = async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await getPinnedChats(userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while fetching pinned chats.",
    });
  }
};

export const getChatSettingsController = async (req, res) => {
  try {
    const { loggedUserId, otherUserId, chatId } = req.params;
    const response = await getChatSettings(loggedUserId, otherUserId, chatId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting chat settings.",
    });
  }
};


export const getAllChatsController = async (req, res) => {
  try {
    const userId = req.userId;
    const response = await getAllChats(userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting user chats.",
    });
  }
};