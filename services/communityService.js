import { CommunityModel } from "../models/Community.js";
import { cloudinary } from "../utils/uploadImage.js";
import { MessageModel } from "../models/Message.js";
import { UserModel } from "../models/User.js";

export const createCommunity = async (communitydata) => {
  try {
    if (communitydata.profileImage) {
      const { secure_url } = await cloudinary.uploader.upload(communitydata.profileImage, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/posts/images`,
        format: "webp",
        unique_filename: true,
      });
      communitydata.profileImage = secure_url;
    }
    const members = [...new Set(communitydata.members)];
    const newCommunity = new CommunityModel({
      ...communitydata,
      members: members,
    });
    await newCommunity.save();
    return {
      status: 200,
      message: "New Community Created",
      data: newCommunity,
    }
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "An error occurred while creating community.",
    };
  }
};

export const getCommunityById = async (communityId) => {
  try {
    const community = await CommunityModel.findById(communityId)

    if (!community) {
      return {
        status: 404,
        message: 'Community not found',
      };
    }

    return {
      status: 200,
      message: 'Community retrieved successfully',
      data: community,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: 'An error occurred while retrieving the community.',
    };
  }
};

export const getAllCommunitiesByUserId = async (userId) => {
  try {
    const communities = await CommunityModel.find({ adminId: userId })
      .populate({
        path: "members",
        model: "Users",
        select: "firstName lastName profilePicture oneLinkId",
      })
      .lean();

    const chatIds = communities.map(chat => chat._id);

    const lastMessagesPromises = chatIds.map(chatId =>
      MessageModel.findOne({ chatId }).sort({ createdAt: -1 }).limit(1).lean()
    );

    const lastMessages = await Promise.all(lastMessagesPromises);

    const chatDetails = communities.map((chat, index) => {
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
      message: 'Communities retrieved successfully',
      data: chatDetails.map((chatDetail) => chatDetail.chat),
    };

  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: 'An error occurred while retrieving communities.',
    };
  }
};


export const getCommunitySettings = async (communityId) => {
  try {
    const community = await CommunityModel.findById(communityId).populate('members').lean();

    const mediaMessages = await MessageModel.find({
      chatId: communityId,
      $or: [
        { image: { $ne: null } },
        { video: { $ne: null } },
        { documentUrl: { $ne: null } },
      ],
    }).select('image video documentUrl').lean();

    const images = mediaMessages.filter(message => message.image && message.image !== null);
    const videos = mediaMessages.filter(message => message.video && message.video !== null);
    const documents = mediaMessages.filter(message => message.documentUrl && message.documentUrl !== null);

    const media = mediaMessages.filter(message => message.image || message.video);

    return {
      status: 200,
      message: "Community settings retrieved successfully.",
      data: {
        community,
        images,
        videos,
        documents,
        media,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: "An error occurred while getting community settings.",
    };
  }
};


export const updateCommunity = async (communityId, updatedData) => {
  try {
    const community = await CommunityModel.findById(communityId);

    if (!community) {
      return {
        status: 404,
        message: 'Community not found',
      };
    }
    if (updatedData.profileImage) {
      const { secure_url } = await cloudinary.uploader.upload(updatedData.profileImage, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/posts/images`,
        format: 'webp',
        unique_filename: true,
      });
      community.profileImage = secure_url;
    }

    community.communityName = updatedData.communityName || community.communityName;
    community.description = updatedData.description || community.description;
    community.about = updatedData.about || community.about;
    community.members = updatedData.members || community.members;

    await community.save();

    return {
      status: 200,
      message: 'Community updated successfully',
      data: community,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: 'An error occurred while updating the community',
    };
  }
};

export const exitCommunity = async (userId, communityId) => {
  try {
    const community = await CommunityModel.findById(communityId);

    if (!community) {
      return {
        status: 404,
        message: "Community not found",
      };
    }
    const isMember = community.members.includes(userId);

    if (!isMember) {
      return {
        status: 400,
        message: "User is not a member of the community",
      };
    }
    community.members = community.members.filter((memberId) => memberId.toString() !== userId);
    await community.save();

    return {
      status: 200,
      message: "User has exited the community",
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: "An error occurred while exiting the community",
    };
  }
};

export const getUnAddedMembers = async (userId, communityId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    const community = await CommunityModel.findById(communityId);
    if (!community) {
      return {
        status: 404,
        message: "Community not found",
      };
    }
    const userConnections = user.connections;
    const unAddedMembers = userConnections.filter(
      (connectionId) => !community.members.includes(connectionId)
    );
    const unAddedMembersInfo = await UserModel.find({
      _id: { $in: unAddedMembers },
    }).select("firstName lastName profilePicture oneLinkId");

    return {
      status: 200,
      message: "Unadded members retrieved successfully",
      data: unAddedMembersInfo,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: "An error occurred while retrieving unadded members",
      data: [],
    };
  }
};

export const addMembersToCommunity = async (communityId, memberIds) => {
  try {
    const community = await CommunityModel.findById(communityId);
    if (!community) {
      return {
        status: 404,
        message: "Community not found",
      };
    }
    community.members = [...new Set([...community.members, ...memberIds])];
    await community.save();
    return {
      status: 200,
      message: "Members added to the community successfully",
      data: community,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: "An error occurred while adding members to the community",
    };
  }
};

export const deleteCommunity = async (communityId, userId) => {
  try {
    const community = await CommunityModel.findOneAndDelete({ _id: communityId, adminId: userId });
    if (!community) {
      return {
        status: 403,
        message: 'You are not authorized to delete this community',
      };
    }
    return {
      status: 200,
      message: 'Community deleted successfully',
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: 'An error occurred while deleting the community',
    };
  }
};
