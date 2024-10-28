import { NotificationModel } from "../models/Notification.js";
import { UserModel } from "../models/User.js";
import { formatDistanceToNow } from 'date-fns';

const timeAgo = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000); // Years
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return `1 year ago`;

  interval = Math.floor(seconds / 2592000); // Months
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return `1 month ago`;

  interval = Math.floor(seconds / 86400); // Days
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return `1 day ago`;

  interval = Math.floor(seconds / 3600); // Hours
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return `1 hour ago`;

  interval = Math.floor(seconds / 60); // Minutes
  if (interval > 1) return `${interval} minutes ago`;
  if (interval === 1) return `1 minute ago`;

  return `just now`; // Fallback for less than a minute
};

function formatSubtitle(description) {
  // Remove HTML tags using a regular expression
  const plainText = description.replace(/<\/?[^>]+(>|$)/g, "");
  
  const lines = plainText.split('.').filter(line => line.trim() !== '');

  const result = lines.slice(0, 1).join(' ');
  return lines.length > 1 ? result + '...' : result;
}


export const addNotification = async (recipient, sender, type, post = null, connection = null, meetingId = null, achievementId = null) => {
  try {
    const user = await UserModel.findOne({oneLinkId:recipient})
    const recipientId = user?user?._id:recipient
    const notification = new NotificationModel({
      recipient:recipientId,
      sender,
      type,
      post,
      connection,
      meetingId,
      achievementId,
    });
    if (sender === recipientId) {
      return;
    }
    await notification.save();
    return {
      status: 200,
      message: "Notification Sent",
      data: notification,
    }
  } catch (error) {
    throw error;
  }
}

export const getNotificationsByUserId = async (userId) => {
  try {
    const notifications = await NotificationModel.find({ recipient: userId })
      .populate({
        path: "sender",
        select: "firstName lastName profilePicture oneLinkId",
      })
      .populate({
        path: "post",
        select: "image video description documentName",
      })
      .sort({ _id: -1 });

    const filteredNotifications = notifications?.filter(notification => {
      return (
        (notification.connection && notification.connection !== null) ||
        (notification.post && notification.post !== null)
      ) && notification.type !== 'meeting';
    });

    const formattedNotifications = filteredNotifications.map(notification => {
      const isPostType = notification.type.includes('post');
      const isConnectionType = notification.type.includes('connection');

      // Determine the title based on type
      let title = "";
      let subtitle = ""
      if (isConnectionType) {
        title =  `${notification.sender?.firstName || ''} ${notification.sender?.lastName || ''}`.trim();
        if (notification.type === 'connectionAccepted') {
          subtitle = `${notification.sender?.firstName || ''} ${notification.sender?.lastName || ''} accepted your request`;
        } else if (notification.type === 'connectionRequest') {
          subtitle = `${notification.sender?.firstName || ''} ${notification.sender?.lastName || ''} sent you a request`;
        }
      } else if (isPostType) {
        subtitle = notification.post?.description || "" ;
        if (notification.type === 'postLiked') {
          title = `${notification.sender?.firstName || ''} ${notification.sender?.lastName || ''} liked your post`;
        } else if (notification.type === 'postCommented') {
          title = `${notification.sender?.firstName || ''} ${notification.sender?.lastName || ''} commented on your post`;
        } else if (notification.type === 'postShared') {
          title = `${notification.sender?.firstName || ''} ${notification.sender?.lastName || ''} shared your post`;
        }
      }

      return {
        id: notification._id,
        title: title.trim(),
        sub_title: formatSubtitle(subtitle),
        image: isPostType
          ? notification.post?.image || ""
          : isConnectionType
          ? notification.sender?.profilePicture || ""
          : "",
        type: notification.type,
        date: timeAgo(new Date(notification.createdAt)),
        is_read: notification.isRead || false,
      };
    });

    return {
      status: true,
      message: "All Notifications fetched",
      data: formattedNotifications,
    };
  } catch (error) {
    console.error("Error in getNotificationsByUserId: ", error);
    return {
      status: false,
      message: "An error occurred while getting the notifications",
      data:"",
    };
  }
};





export const markMessageAsRead = async (messageId) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: messageId },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notification) {
      return {
        status: false,
        message: "Notification not found",
      };
    }
    return {
      status: true,
      message: "Message marked as read",
      data: notification,
    };
  } catch (error) {
    return {
      status: false,
      message: "An error occurred while marking the message as read",
    };
  }
};

export const markAllMessagesAsRead = async (userId) => {
  try {
    const result = await NotificationModel.updateMany(
      { recipient: userId },
      { $set: { isRead: true } }
    );
    if (result.nModified === 0) {
      return {
        status: false,
        message: "No unread notifications found for the user",
      };
    }
    return {
      status: true,
      message: "All messages marked as read",
    };
  } catch (error) {
    return {
      status: false,
      message: "An error occurred while marking all messages as read",
    };
  }
};

export const deleteNotification = async (recipient, sender, type, id) => {
  try {
    const result = await NotificationModel.deleteMany({
      $and: [
        {
          $or: [
            { connection: id },
            { post: id },
            { meetingId: id },
          ],
        },
        { recipient, sender, type },
      ],
    });
    if (result.deletedCount === 0) {
      return {
        status: 200,
        message: "No notifications found for the given ID and recipients",
      };
    }
    return {
      status: 200,
      message: "Notifications deleted successfully by connection or post ID and recipients",
    };
  } catch (error) {
    throw error;
  }
};

export const getUnreadNotificationCount = async (userId) => {
  try {

    const notifications = await NotificationModel.find({ recipient: userId, isRead: false, }).populate("post");

    const filteredNotifications = notifications?.filter(notification => {
      return (
        (notification.connection && notification.connection !== null) ||
        (notification.post && notification.post !== null)
      );
    });
    return {
      status: true,
      message: "Unread notification count retrieved",
      data: { unreadCount: filteredNotifications?.length },
    };
  } catch (error) {
    return {
      status: false,
      message: "An error occurred while getting the unread notification count",
    };
  }
};
