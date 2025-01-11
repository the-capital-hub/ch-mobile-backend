import { CommunityModel } from "../models/Community.js";
import { cloudinary } from "../utils/uploadImage.js";
import { MessageModel } from "../models/Message.js";
import { UserModel } from "../models/User.js";

const base64ToBuffer = (base64String) => {  
  const buffer = Buffer.from(base64String, 'base64');
  return buffer
};

export const createCommunity = async (communitydata, adminId) => {
  try {
    if (communitydata.profileImage) {

      
      const imageBuffer = base64ToBuffer(communitydata.profileImage);
      const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`; 
      const { secure_url } = await cloudinary.uploader.upload(imageBase64, {
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
      adminId: adminId,
    });
    await newCommunity.save();
    return {
      status: true,
      message: "New Community Created",
      data: newCommunity,
    }
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while creating community.",
    };
  }
};

export const getCommunityById = async (communityId) => {
  try {
    const community = await CommunityModel.findById(communityId)

    if (!community) {
      return {
        status: false,
        message: 'Community not found',
      };
    }

    return {
      status: true,
      message: 'Community retrieved successfully',
      data: community,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
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
        select: "firstName lastName profilePicture",
      })
      .lean()
      .sort({ createdAt: -1 });

    const formattedCommunities = communities.map(community => ({
      communityImage: community.profileImage || "",
      communityDescription: community.description || "",
      communityId: community._id || "",
      communityName: community.communityName || "",
      memberCount: community.members?.length || 0,
      memberProfileImages: community.members?.map(member => member.profilePicture || "") || [],
      memberNames: community.members?.map(member => 
        `${member.firstName || ""} ${member.lastName || ""}`.trim() || ""
      ) || []
    }));

    return {
      status: true,
      message: 'Communities retrieved successfully',
      data: formattedCommunities,
    };

  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: 'An error occurred while retrieving communities.',
      data: [],
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
      status: true,
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
      status: false,
      message: "An error occurred while getting community settings.",
    };
  }
};


export const updateCommunity = async (communityId, updatedData) => {
  try {
    const community = await CommunityModel.findById(communityId);

    if (!community) {
      return {
        status: false,
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
      status: true,
      message: 'Community updated successfully',
      data: community,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: 'An error occurred while updating the community',
    };
  }
};

export const exitCommunity = async (userId, communityId) => {
  try {
    const community = await CommunityModel.findById(communityId);

    if (!community) {
      return {
        status: false,
        message: "Community not found",
      };
    }
    const isMember = community.members.includes(userId);

    if (!isMember) {
      return {
        status: false,
        message: "User is not a member of the community",
      };
    }
    community.members = community.members.filter((memberId) => memberId.toString() !== userId);
    await community.save();

    return {
      status: true,
      message: "User has exited the community",
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while exiting the community",
    };
  }
};

export const getUnAddedMembers = async (userId, communityId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    const community = await CommunityModel.findById(communityId);
    if (!community) {
      return {
        status: false,
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
      status: true,
      message: "Unadded members retrieved successfully",
      data: unAddedMembersInfo,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
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
        status: false,
        message: "Community not found",
      };
    }
    community.members = [...new Set([...community.members, ...memberIds])];
    await community.save();
    return {
      status: true,
      message: "Members added to the community successfully",
      data: community,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while adding members to the community",
    };
  }
};  

export const deleteCommunity = async (communityId, userId) => {
  try {
    const community = await CommunityModel.findOneAndDelete({ _id: communityId, adminId: userId });
    if (!community) {
      return {
        status: false,
        message: 'You are not authorized to delete this community',
      };
    }
    return {
      status: true,
      message: 'Community deleted successfully',
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: 'An error occurred while deleting the community',
    };
  }
};
