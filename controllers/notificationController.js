import {
  addNotification,
  getNotificationsByUserId,
  markMessageAsRead,
  markAllMessagesAsRead,
  getUnreadNotificationCount,
} from "../services/notificationService.js";

export const addNotificationController = async (req, res) => {
  try {
    const {
      recipient,
      sender,
      type, 
      post,
      connection,
      meetingId,
      achievementId,
    } = req.body;

    const response = await addNotification(
      recipient,
      sender,
      type,
      post,
      connection,
      meetingId,
      achievementId);

    return res.status(response.status).send(response);
  } catch (error) {
    console.log(error);
    return {
      staus: 500,
      message: "An error occured while getting the notifications",
    }
  }
}

export const getNotificationsByUserIdController = async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await getNotificationsByUserId(userId);
    return res.send(response);
  } catch (error) {
    console.log(error);
   return res.json({
    status: false,
    message:"An error has occured in fetching notificaions",
    data : null,
   })
  }
}

export const markMessageAsReadController = async (req, res) => {
  try {
    const { messageId } = req.params;
    const response = await markMessageAsRead(messageId);
    return res.send(response);
  } catch (error) {
    console.error(error);
    return res.json({
    status: false,
    message:"An error has occured",
    data : null,
   })
  }
};

export const markAllMessagesAsReadController = async (req, res) => {
  try {
    const userId = req.userId;
    const response = await markAllMessagesAsRead(userId);
    return res.send(response);
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      message:"An error has occured",
      data : null,
     })
  }
};

export const getUnreadNotificationCountController = async (req, res) => {
  try {
    const userId = req.userId;
    const response = await getUnreadNotificationCount(userId);
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      message: "An error occurred while getting the unread notification count",
    });
  }
};

