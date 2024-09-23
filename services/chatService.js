import { ChatModel } from "../models/Chat.js";
import { UserModel } from "../models/User.js";
import { CommunityModel } from "../models/Community.js";
import { MessageModel } from "../models/Message.js";

export const createChat = async (senderId, recieverId) => {
  try {
    const existingChat = await ChatModel.findOne({
      members: { $all: [senderId, recieverId] },
    });

    if (existingChat) {
      return {
        status: 200,
        message: "Chat already exists",
      };
    }

    const newChat = new ChatModel({
      members: [senderId, recieverId],
    });
    await newChat.save();
    return {
      status: 200,
      message: "New Chat Created",
      data: newChat,
    }
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "An error occurred while creating chat.",
    };
  }
};

export const getUserChats = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    const pinnedChatIds = user.pinnedChat;

    const chats = await ChatModel.find({
      members: { $in: [userId] },
      _id: { $nin: pinnedChatIds },
    }).lean().populate('members');

    if (chats.length === 0) {
      return {
        status: 404,
        message: "Chats not found",
        data: [],
      };
    }

    const chatIds = chats.map(chat => chat._id);

    const lastMessagesPromises = chatIds.map(chatId =>
      MessageModel.findOne({ chatId }).sort({ createdAt: -1 }).limit(1).lean()
    );

    const lastMessages = await Promise.all(lastMessagesPromises);

    const chatDetails = chats.map((chat, index) => {
      return {
        chat,
        lastMessage: lastMessages[index],
      };
    });

    chatDetails.sort((a, b) => {
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
      status: 200,
      message: "User's Chats Retrieved",
      data: chatDetails.map((chatDetail) => chatDetail.chat),
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
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
        status: 200,
        message: "Chat not found",
        data: [],
      };
    }
    return {
      status: 200,
      message: "Chat Retrieved",
      data: chat,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
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
        status: 404,
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
      status: 200,
      message: "Chat pinned/unpinned successfully",
      data: user,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
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
        status: 404,
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
      status: 200,
      message: "Pinned chats retrieved successfully",
      data: pinnedChatDetails.map((chatDetail) => chatDetail.chat),
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
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
      status: 200,
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
      status: 500,
      message: "An error occurred while getting chat settings.",
    };
  }
};


// export const getAllChats = async (userId) => {
//   try {

//     // all chat
//     const user = await UserModel.findById(userId);
//     const pinnedChatIds = user.pinnedChat;

//     const chats = await ChatModel.find({
//       members: { $in: [userId] },
//       _id: { $nin: pinnedChatIds },
//     }).lean().populate('members');

//     const chatIds = chats.map(chat => chat._id);

//     const lastMessagesPromises = chatIds.map(chatId =>
//       MessageModel.findOne({ chatId }).sort({ createdAt: -1 }).limit(1).lean()
//     );

//     const lastMessages = await Promise.all(lastMessagesPromises);

//     const chatDetails = chats.map((chat, index) => {
//       return {
//         chat,
//         lastMessage: lastMessages[index],
//       };
//     });

//     chatDetails.sort((a, b) => {
//       if (a.lastMessage && b.lastMessage) {
//         return b.lastMessage.createdAt - a.lastMessage.createdAt;
//       } else if (a.lastMessage) {
//         return -1;
//       } else if (b.lastMessage) {
//         return 1;
//       }
//       return 0;
//     });

//     //pinned chat
//     const _user = await UserModel.findById(userId)
//       .populate({
//         path: "pinnedChat",
//         populate: {
//           path: "members",
//           model: "Users"
//         }
//       })
//       .lean();

//     const _pinnedChatIds = _user.pinnedChat.map(chat => chat._id);

//     const _lastMessagesPromises = _pinnedChatIds.map(chatId =>
//       MessageModel.findOne({ chatId }).sort({ createdAt: -1 }).limit(1).lean()
//     );

//     const _lastMessages = await Promise.all(_lastMessagesPromises);

//     const pinnedChatDetails = _user.pinnedChat.map((chat, index) => {
//       return {
//         chat,
//         lastMessage: _lastMessages[index],
//       };
//     });

//     pinnedChatDetails.sort((a, b) => {
//       if (a.lastMessage && b.lastMessage) {
//         return b.lastMessage.createdAt - a.lastMessage.createdAt;
//       } else if (a.lastMessage) {
//         return -1;
//       } else if (b.lastMessage) {
//         return 1;
//       }
//       return 0;
//     });

//     // communities 
//     const communities = await CommunityModel.find({ members: userId })
//       .populate({
//         path: "members",
//         model: "Users",
//         select: "firstName lastName profilePicture",
//       })
//       .lean();

//     const _chatIds = communities.map(chat => chat._id);

//     const clastMessagesPromises = _chatIds.map(chatId =>
//       MessageModel.findOne({ chatId }).sort({ createdAt: -1 }).limit(1).lean()
//     );

//     const clastMessages = await Promise.all(clastMessagesPromises);

//     const _chatDetails = communities.map((chat, index) => {
//       return {
//         chat,
//         lastMessage: clastMessages[index],
//       };
//     });

//     _chatDetails.sort((a, b) => {
//       if (a.lastMessage && b.lastMessage) {
//         return b.lastMessage.createdAt - a.lastMessage.createdAt;
//       } else if (a.lastMessage) {
//         return -1;
//       } else if (b.lastMessage) {
//         return 1;
//       }
//       return 0;
//     });

//     return {
//       status: 200,
//       data: {
//         allChats: chatDetails.map((chatDetail) => chatDetail.chat),
//         pinnedChat: pinnedChatDetails.map((chatDetail) => chatDetail.chat),
//         communities: _chatDetails.map((chatDetail) => chatDetail.chat),
//       }
//     }

//   } catch (error) {
//     console.error(error);
//     return {
//       status: 500,
//       message: "An error occurred while getting chats.",
//     };
//   }
// };

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
      status: 200,
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
      status: 500,
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