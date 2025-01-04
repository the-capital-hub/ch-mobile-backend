import { ChatModel } from "../models/Chat.js";
import { UserModel } from "../models/User.js";
import { CommunityModel } from "../models/Community.js";
import { MessageModel } from "../models/Message.js";

const formatLastMessageTime = (dateString) => {
  const date = new Date(dateString);

  // Define options for the time format
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // To get 12-hour format (AM/PM)
  };

  // Format the date and time
  const formattedDate = date.toLocaleString('en-GB', options);
  
  // Replace the comma with ' ,'
  return formattedDate.replace(',', ' ,');
};

export const createChat = async (senderId, recieverId) => {
  try {
    // Find existing chat and populate receiver details
    const existingChat = await ChatModel.findOne({
      members: { $all: [senderId, recieverId] },
    });

    // Get receiver details from UserModel
    const receiverDetails = await UserModel.findById(recieverId).select('firstName lastName profilePicture designation');

    if (existingChat) {
      return {
        status: true,
        message: "Chat already exists",
        data: {
          chatId: existingChat._id,
          senderName: receiverDetails.firstName + " " + receiverDetails.lastName,
          senderImage: receiverDetails.profilePicture || "",
          senderDesignation: receiverDetails.designation || "",
          lastMessage: "",
          unreadCount: 0,
          lastMessageTime: ""
        }
      };
    }

    const newChat = new ChatModel({
      members: [senderId, recieverId],
    });
    await newChat.save();

    return {
      status: true,
      message: "New Chat Created",
      data: {
        chatId: newChat._id,
        receiverName: receiverDetails.name,
        receiverProfilePicture: receiverDetails.profilePicture,
        receiverDesignation: receiverDetails.designation,
        lastMessage: "",
        unreadCount: 0,
        lastMessageTime: ""
      }
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while creating chat.",
    };
  }
};

export const getUserChats = async (userId) => {
  try {
    // Find the user and get pinned chats
    const user = await UserModel.findById(userId);
    const pinnedChatIds = user.pinnedChat;

    // Get pinned chats
    const pinnedChats = await ChatModel.find({
      _id: { $in: pinnedChatIds },
      members: { $in: [userId] },
    }).lean().populate('members');

    // Get normal chats excluding pinned ones
    const normalChats = await ChatModel.find({
      members: { $in: [userId] },
      _id: { $nin: pinnedChatIds },
    }).lean().populate('members');

    // Combine the two arrays into one
    const allChats = [...pinnedChats, ...normalChats];

    // Prepare promises to fetch last messages and unread count for all chats
    const lastMessagesPromises = allChats.map(chat => 
      MessageModel.findOne({ chatId: chat._id }).sort({ createdAt: -1 }).limit(1).lean()
    );
    
    const unreadCountPromises = allChats.map(chat => 
      MessageModel.countDocuments({ chatId: chat._id, read: false, sender: { $ne: userId } })
    );

    // Fetch last messages and unread counts concurrently
    const [lastMessages, unreadCounts] = await Promise.all([Promise.all(lastMessagesPromises), Promise.all(unreadCountPromises)]);

    // Format the chat details with necessary information
    const chatDetails = allChats.map((chat, index) => {
      const lastMessage = lastMessages[index];
      const unreadCount = unreadCounts[index];
      const sender = chat.members.find(member => member._id.toString() !== userId.toString());

      const isBlockedByMe = user?.blockedUsers?.includes(sender._id);
      const isBlockedBySender = sender?.blockedUsers?.some(id => id.equals(userId))
      return {
        chatId: chat._id,
        sender_id: sender?._id,
        senderImage: sender?.profilePicture || '',
        senderName: sender?.firstName +" "+ sender?.lastName || '',
        senderDesignation: sender?.designation || '',
        lastMessage: lastMessage?.text || '',
        unreadCount,
        is_blocked_by_me: isBlockedByMe,
        is_blocked_by_other_user: isBlockedBySender || false,
        lastMessageTime: formatLastMessageTime(lastMessage?.createdAt) || '',
      };
    });

    // Separate pinned and normal chats
    const pinnedChatsResponse = chatDetails.filter(chat => pinnedChatIds.includes(chat.chatId));
    const normalChatsResponse = chatDetails.filter(chat => !pinnedChatIds.includes(chat.chatId));

    // Sort both arrays by last message time in descending order
    pinnedChatsResponse.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    normalChatsResponse.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    return {
      status: true,
      message: "User's Chats Retrieved",
      data: {
        pinnedChats: pinnedChatsResponse,
        normalChats: normalChatsResponse,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while fetching user's chats.",
    };
  }
};


export const findChat = async (firstId, secondId) => {
  try {
    const chat = await ChatModel.findOne({
      members: { $all: [firstId, secondId] },
    });
    if (!chat) {
      return {
        status: true,
        message: "Chat not found",
        data: [],
      };
    }
    return {
      status: true,
      message: "Chat Retrieved",
      data: chat,
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while finding the chat.",
    };
  }
};

// Pin or Unpin a Chat
export const togglePinChat = async (userId, chatId) => {
  try {
    const userDetails = await UserModel.findById(userId);
    if (!userDetails) {
      return {
        status: false,
        message: "User not found",
      };
    }

    const pinnedChatIds = userDetails.pinnedChat;
    const isChatPinned = pinnedChatIds.includes(chatId);

    const update = isChatPinned
      ? { $pull: { pinnedChat: chatId } }
      : { $push: { pinnedChat: chatId } };

    const user = await UserModel.findOneAndUpdate(
      { _id: userId },
      update,
      { new: true }
    );

    return {
      status: true,
      message: "Chat pinned/unpinned successfully",
      data: user,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while pinning/unpinning the chat.",
    };
  }
};


// Get Pinned Chats
export const getPinnedChats = async (userId) => {
  try {
    const user = await UserModel.findById(userId)
      .populate({
        path: "pinnedChat",
        populate: {
          path: "members",
          model: "Users"
        }
      })
      .lean();

    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }

    const pinnedChatIds = user.pinnedChat.map(chat => chat._id);

    const lastMessagesPromises = pinnedChatIds.map(chatId =>
      MessageModel.findOne({ chatId }).sort({ createdAt: -1 }).limit(1).lean()
    );

    const lastMessages = await Promise.all(lastMessagesPromises);

    const pinnedChatDetails = user.pinnedChat.map((chat, index) => {
      return {
        chat,
        lastMessage: lastMessages[index],
      };
    });

    pinnedChatDetails.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return b.lastMessage.createdAt - a.lastMessage.createdAt;
      } else if (a.lastMessage) {
        return -1;
      } else if (b.lastMessage) {
        return 1;
      }
      return 0;
    });

    return {
      status: true,
      message: "Pinned chats retrieved successfully",
      data: pinnedChatDetails.map((chatDetail) => chatDetail.chat),
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while fetching pinned chats.",
    };
  }
};

export const getChatSettings = async (loggedUserId, otherUserId, chatId) => {
  try {
    const user = await UserModel.findById(otherUserId).lean();
    const communities = await CommunityModel.find({
      members: { $all: [loggedUserId, otherUserId] },
    }).lean().populate('members');

    const mediaMessages = await MessageModel.find({
      chatId: chatId,
      $or: [
        { image: { $ne: null } },
        { video: { $ne: null } },
        { documentUrl: { $ne: null } },
      ],
    }).select('image video documentUrl');

    const images = mediaMessages.filter(message => message.image && message.image !== null);
    const videos = mediaMessages.filter(message => message.video && message.video !== null);
    const documents = mediaMessages.filter(message => message.documentUrl && message.documentUrl !== null);
    const media = mediaMessages.filter(message => message.image || message.video);

    return {
      status: true,
      message: "Chat settings retrieved successfully.",
      data: {
        user,
        communities,
        images,
        videos,
        documents,
        media
      },
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while getting chat settings.",
    };
  }
};

export const getAllChats = async (userId) => {
  try {
    // all chat
    const user = await UserModel.findById(userId);
    const pinnedChatIds = user.pinnedChat;

    const [chats, pinnedChats, communities] = await Promise.all([
      ChatModel.find({
        members: { $in: [userId] },
        _id: { $nin: pinnedChatIds },
      }).populate('members'),

      UserModel.findById(userId)
        .populate({
          path: "pinnedChat",
          populate: {
            path: "members",
            model: "Users"
          }
        })
      ,

      CommunityModel.find({ members: userId })
        .populate({
          path: "members",
          model: "Users",
          select: "firstName lastName profilePicture oneLinkId",
        })

    ]);

    const chatDetails = await getChatDetails(chats, userId);
    const pinnedChatDetails = await getChatDetails(pinnedChats.pinnedChat, userId);
    const communityDetails = await getChatDetails(communities, userId);

    //last messages
    const allChatLastMessage = createLastMessageObject(chatDetails);
    const allPinnedChatLastMessages = createLastMessageObject(pinnedChatDetails);
    const allCommunityChatLastMessage = createLastMessageObject(communityDetails);

    //last messages date
    const allChatLastMessageDates = createLastMessageDateObject(chatDetails);
    const allPinnedChatLastMessagesDates = createLastMessageDateObject(pinnedChatDetails);
    const allCommunityChatLastMessageDates = createLastMessageDateObject(communityDetails);

    // Unread message counts
    const allChatsUnreadMessageCount = await calculateUnreadMessageCount(chats, userId);
    const allPinnedChatUnreadMessageCount = await calculateUnreadMessageCount(pinnedChats.pinnedChat, userId);
    const allCommunityChatUnreadMessageCount = await calculateUnreadMessageCount(communities, userId);

    return {
      status: true,
      data: {
        allChats: chatDetails.map((chatDetail) => chatDetail.chat),
        allChatLastMessage,
        allChatLastMessageDates,
        allChatsUnreadMessageCount,
        pinnedChat: pinnedChatDetails.map((chatDetail) => chatDetail.chat),
        allPinnedChatLastMessages,
        allPinnedChatLastMessagesDates,
        allPinnedChatUnreadMessageCount,
        communities: communityDetails.map((chatDetail) => chatDetail.chat),
        allCommunityChatLastMessage,
        allCommunityChatLastMessageDates,
        allCommunityChatUnreadMessageCount,
      }
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while getting chats.",
    };
  }
};

const getChatDetails = async (chats, userId) => {
  const details = await Promise.all(chats.map(async (chat) => {
    const lastMessage = await MessageModel.findOne({ chatId: chat._id })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate('senderId');

    return { chat, lastMessage };
  }));

  return details.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return b.lastMessage.createdAt - a.lastMessage.createdAt;
    } else if (a.lastMessage) {
      return -1;
    } else if (b.lastMessage) {
      return 1;
    }
    return 0;
  });
};

const createLastMessageObject = (chatDetails) => {
  const lastMessageObject = {};
  chatDetails.forEach((chatDetail) => {
    const { chat, lastMessage } = chatDetail;
    if (lastMessage) {
      lastMessageObject[chat._id] = lastMessage.text;
    }
  });
  return lastMessageObject;
};


const createLastMessageDateObject = (chatDetails) => {
  const lastMessageDateObject = {};
  chatDetails.forEach((chatDetail) => {
    const { chat, lastMessage } = chatDetail;
    if (lastMessage) {
      lastMessageDateObject[chat._id] = lastMessage.createdAt;
    }
  });
  return lastMessageDateObject;
};


const calculateUnreadMessageCount = async (chats, userId) => {
  const unreadMessageCount = {};

  for (const chat of chats) {
    const unreadCount = await MessageModel.countDocuments({
      chatId: chat._id,
      senderId: { $ne: userId },
      read: false,
    });
    unreadMessageCount[chat._id] = unreadCount;
  }
  return unreadMessageCount;
};