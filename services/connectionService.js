import { ConnectionModel } from "../models/Connection.js";
import { UserModel } from "../models/User.js";
import { addNotification, deleteNotification } from "./notificationService.js";


const formatDate = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const days = Math.floor(seconds / 86400);
  const months = Math.floor(days / 30); 
  const years = Math.floor(days / 365);

  if (years > 1) return `${years} years ago`;
  if (years === 1) return `1 year ago`;
  if (months > 1) return `${months} months ago`;
  if (months === 1) return `1 month ago`;
  if (days > 1) return `${days} days ago`;
  if (days === 1) return `1 day ago`;
  
  const hours = Math.floor(seconds / 3600);
  if (hours > 1) return `${hours} hours ago`;
  if (hours === 1) return `1 hour ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes > 1) return `${minutes} minutes ago`;
  if (minutes === 1) return `1 minute ago`;

  return 'just now';
};

//send connect request
export const sendConnectionRequest = async (senderId, receiverId) => {
  try {
    const existingConnection = await ConnectionModel.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });
    if (existingConnection) {
      return {
        status: false,
        message: "Connection request already sent",
        data: [],
      };
    }
    const connection = new ConnectionModel({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });
    await connection.save();
    await UserModel.findOneAndUpdate(
      { _id: connection.sender },
      { $push: { connectionsSent: connection.receiver } }
    );
    await UserModel.findOneAndUpdate(
      { _id: connection.receiver },
      { $push: { connectionsReceived: connection.sender } }
    );
    const type = "connectionRequest";
    await addNotification(receiverId, senderId, type, null, connection._id);
    return {
      status: true,
      message: "Connection Request Sent",
      data: connection,
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while sending connection request.",
    };
  }
};

export const getConnectionRequestBetweenTwoPeople = async(userId, otherUserId, status) =>{
      try{
        const request = await ConnectionModel.find({
        sender: userId,
        receiver: otherUserId,
        status: status
      });
      return request;
    }catch(error){
      console.log(error);
    }
}
// get sent pending connections of a user
export const getSentPendingConnectionRequests = async (userId) => {
  try {
    const sentRequests = await ConnectionModel.find({
      sender: userId,
      status: "pending",
    }).populate("receiver", "firstName lastName profilePicture designation startUp investor oneLinkId");

    await Promise.all(sentRequests.map(async (request) => {
      await request.receiver.populate("startUp investor");
    }));

    if (sentRequests.length === 0) {
      return {
        status: true,
        message: "No pending request found",
        data: [],
      };
    }

    const formattedRequests = sentRequests.map((request) => {
      const formattedCreatedAt = formatDate(request.createdAt);
      return {
          connectionId: request._id,
          id: request.receiver._id,
          firstName: request.receiver.firstName,
          lastName: request.receiver.lastName,
          profilePicture: request.receiver.profilePicture || "",
          designation: request.receiver.designation,
          createdAt: formattedCreatedAt,
      };
    });

    return {
      status: true,
      message: "Sent pending connection requests retrieved successfully",
      data: formattedRequests,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while getting sent pending connection requests.",
    };
  }
};

// Cancel  connection request
export const cancelConnectionRequest = async (connectionId) => {
  try {
    const connection = await ConnectionModel.findById(connectionId);
    if (!connection) {
      return {
        status: false,
        message: "Connection not found",
      };
    }
    await ConnectionModel.findByIdAndRemove(connectionId);
    const type = "connectionRequest";
    await deleteNotification(connection.receiver, connection.sender, type, connection._id);
    await UserModel.findOneAndUpdate(
      { _id: connection.sender },
      { $pull: { connectionsSent: connection.receiver } }
    );
    await UserModel.findOneAndUpdate(
      { _id: connection.receiver },
      { $pull: { connectionsReceived: connection.sender } }
    );

    const sentRequests = await ConnectionModel.find({
      sender: connection.sender,
      status: "pending",
    }).populate("receiver", "firstName lastName profilePicture designation startUp investor oneLinkId");

    await Promise.all(sentRequests.map(async (request) => {
      await request.receiver.populate("startUp investor");
    }));

    if (sentRequests.length === 0) {
      return {
        status: true,
        message: "No pending request found",
        data: [],
      };
    }

    const formattedRequests = sentRequests.map((request) => {
      const formattedCreatedAt = formatDate(request.createdAt);
      return {
          connectionId: request._id,
          id: request.receiver._id,
          firstName: request.receiver.firstName,
          lastName: request.receiver.lastName,
          profilePicture: request.receiver.profilePicture || "",
          designation: request.receiver.designation,
          createdAt: formattedCreatedAt,
      };
    });

    return {
      status: true,
      message: "Connection Request Canceled",
      data: formattedRequests,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while canceling the connection request.",
    };
  }
};

// Get pending connection requests received by a user
export const getPendingConnectionRequests = async (userId) => {
  try {
    const pendingRequests = await ConnectionModel.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "firstName lastName profilePicture designation startUp investor oneLinkId")
      .sort({ _id: "-1" });
    for (const request of pendingRequests) {
      await request.sender.populate("startUp investor");
    }
    const formattedRequests = pendingRequests.map((request) => ({
      connectionId: request._id,
      id: request.sender._id,
      firstName: request.sender.firstName,
      lastName: request.sender.lastName,
      profilePicture: request.sender.profilePicture || "",
      designation: request.sender.designation,
      createdAt: formatDate(request.createdAt),
    }));
    return {
      status: true,
      message: "Pending requests retrived successfully",
      data: formattedRequests,
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while getting pending connection request.",
    };
  }
};

//accept user connections
export const acceptConnectionRequest = async (connectionId) => {
  try {
    const connection = await ConnectionModel.findByIdAndUpdate(
      connectionId,
      { status: "accepted" },
      { new: true }
    ).populate('sender receiver');

    await connection.sender.populate("startUp");
    await connection.sender.populate("investor");
    await connection.receiver.populate("startUp");
    await connection.receiver.populate("investor");
    const { sender, receiver } = connection;
    let isFirst = false;
    if (sender.startUp?.founderId.toString() === sender._id.toString() || sender.investor?.founderId.toString() === sender._id.toString()) {
      if (!sender.achievements.includes('6568616cef0982c58957e779')) {
        await UserModel.findByIdAndUpdate(sender._id, { $push: { achievements: '6568616cef0982c58957e779' } });
        const type = "achievementCompleted";
        await addNotification(connection.sender, null, type, null, null, null, "6568616cef0982c58957e779");
      }
    }
    if (receiver.startUp?.founderId.toString() === receiver._id.toString() || receiver.investor?.founderId.toString() === receiver._id.toString()) {
      if (!receiver.achievements.includes('6568616cef0982c58957e779')) {
        await UserModel.findByIdAndUpdate(receiver._id, { $push: { achievements: '6568616cef0982c58957e779' } });
        isFirst = true;
        const type = "achievementCompleted";
        await addNotification(connection.receiver, null, type, null, null, null, "6568616cef0982c58957e779");
      }
    }
    await UserModel.findByIdAndUpdate(sender._id, {
      $pull: { connectionsSent: receiver._id },
      $push: { connections: receiver._id },
    });
    await UserModel.findByIdAndUpdate(receiver._id, {
      $pull: { connectionsReceived: sender._id },
      $push: { connections: sender._id },
    });

    const type = "connectionAccepted";
    await addNotification(sender._id, receiver._id, type, null, connection._id);

    const pendingRequests = await ConnectionModel.find({
      receiver: receiver._id,
      status: "pending",
    })
      .populate("sender", "firstName lastName profilePicture designation startUp investor oneLinkId")
      .sort({ _id: "-1" });
    for (const request of pendingRequests) {
      await request.sender.populate("startUp investor");
    }
    const formattedRequests = pendingRequests.map((request) => ({
      connectionId: request._id,
      id: request.sender._id,
      firstName: request.sender.firstName,
      lastName: request.sender.lastName,
      profilePicture: request.sender.profilePicture || "",
      designation: request.sender.designation,
      createdAt: formatDate(request.createdAt),
    }));


    return {
      status: true,
      message: "Connection Accepted",
      data: formattedRequests
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while accepting the connection request.",
    };
  }
};

//reject user connections
export const rejectConnectionRequest = async (connectionId) => {
  try {
    const connection = await ConnectionModel.findByIdAndUpdate(
      connectionId,
      { status: "rejected" },
      { new: true }
    );
    await UserModel.findOneAndUpdate(
      { _id: connection.sender },
      { $pull: { connectionsSent: connection.receiver } }
    );
    await UserModel.findOneAndUpdate(
      { _id: connection.receiver },
      { $pull: { connectionsReceived: connection.sender } }
    );
    const type = "connectionAccepted";
    await deleteNotification(connection.sender, connection.receiver, type, connection._id);

    const pendingRequests = await ConnectionModel.find({
      receiver: connection.receiver,
      status: "pending",
    })
      .populate("sender", "firstName lastName profilePicture designation startUp investor oneLinkId")
      .sort({ _id: "-1" });
    for (const request of pendingRequests) {
      await request.sender.populate("startUp investor");
    }
    const formattedRequests = pendingRequests.map((request) => ({
      connectionId: request._id,
      id: request.sender._id,
      firstName: request.sender.firstName,
      lastName: request.sender.lastName,
      profilePicture: request.sender.profilePicture || "",
      designation: request.sender.designation,
      createdAt: formatDate(request.createdAt),
    }));


    return {
      status: true,
      message: "Connection Rejected",
      data: formattedRequests,
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while rejecting the connection request.",
    };
  }
};

//get all user connections
export const getUserConnections = async (userId) => {
  try {
    const user = await UserModel.findById(userId).populate(
      "connections",
      "firstName lastName profilePicture designation startUp investor oneLinkId"
    );
    for (const connection of user.connections) {
      await connection.populate("startUp investor");
    }

    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    const connectionsData = user.connections.map(connection => ({
      connectionId: "",
      id: connection._id,
      firstName: connection.firstName || "",
      lastName: connection.lastName || "",
      designation: connection.designation || "",
      profilePicture: connection.profilePicture || "",
    }));
    return {
      status: true,
      message: "Connections retrieved successfully",
      data: connectionsData,
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while getting user connections.",
    };
  }
};

//remove accepted connection
export const removeConnection = async (loggedUserId, otherUserId) => {
  try {
    await ConnectionModel.deleteMany({
      sender: loggedUserId,
      receiver: otherUserId,
    });
    await ConnectionModel.deleteMany({
      sender: otherUserId,
      receiver: loggedUserId,
    });
    await UserModel.findOneAndUpdate(
      { _id: loggedUserId },
      { $pull: { connections: otherUserId } }
    );
    await UserModel.findOneAndUpdate(
      { _id: otherUserId },
      { $pull: { connections: loggedUserId } }
    );


    const user = await UserModel.findById(loggedUserId).populate(
      "connections",
      "firstName lastName profilePicture designation startUp investor oneLinkId"
    );
    for (const connection of user.connections) {
      await connection.populate("startUp investor");
    }

    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    const connectionsData = user.connections.map(connection => ({
      connectionId: "",
      id: connection._id,
      firstName: connection.firstName || "",
      lastName: connection.lastName || "",
      designation: connection.designation || "",
      profilePicture: connection.profilePicture || "",
    }));

    return {
      status: true,
      message: "Connection Removed",
      data: connectionsData
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while removing the connection.",
    };
  }
};

export const getRecommendations = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    const recommendations = [];
    const userConnections = user.connections;
    const userSentConnections = user.connectionsSent || " ";
    const userReceivedConnections = user.connectionsReceived || " ";
    for (const connectedUserId of userConnections) {
      const connectedUser = await UserModel.findById(connectedUserId);

      if (connectedUser && connectedUser.connections) {
        const mutualConnections = connectedUser.connections;

        for (const connectionId of mutualConnections) {
          if (
            connectionId.toString() !== userId &&
            !recommendations.includes(connectionId) && !userConnections.includes(connectionId)
          ) {
            const existsPendingConnections = await ConnectionModel.findOne({
              $or: [
                { sender: userId, receiver: connectionId, status: "pending" },
                { sender: connectionId, receiver: userId, status: "pending" },
              ],
            });
            if (!existsPendingConnections) recommendations.push(connectionId);
          }
        }
      }
    }

    if (recommendations.length === 0) {
      const users = await UserModel.find({
        _id: {
          $nin: [
            ...userConnections,
            userId,
            ...userSentConnections,
            ...userReceivedConnections
          ]
        },
        userStatus: "active",
      });
      return {
        status: true,
        message: "Recommended User data retrieved successfully",
        data: users,
      };
    }
    const users = await UserModel.find({ _id: { $in: recommendations } });
    return {
      status: true,
      message: "Recommended User data retrieved successfully",
      data: users,
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
      message: "An error occurred while getting recommendations",
    };
  }
};
