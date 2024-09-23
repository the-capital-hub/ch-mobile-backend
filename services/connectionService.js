import { ConnectionModel } from "../models/Connection.js";
import { UserModel } from "../models/User.js";
import { addNotification, deleteNotification } from "./notificationService.js";

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
        status: 400,
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
      status: 200,
      message: "Connection Request Sent",
      data: connection,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "An error occurred while sending connection request.",
    };
  }
};

// get sent pending connections of a user
export const getSentPendingConnectionRequests = async (userId) => {
  try {
    const sentRequests = await ConnectionModel.find({
      sender: userId,
      status: "pending",
    }).populate("receiver", "firstName lastName profilePicture designation startUp investor oneLinkId");
    for (const request of sentRequests) {
      await request.receiver.populate("startUp investor");
    }
    if (sentRequests.length === 0) {
      return {
        status: 200,
        message: "No pending request found",
        data: [],
      };
    }
    return {
      status: 200,
      message: "Sent pending connection requests retrieved successfully",
      data: sentRequests,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message:
        "An error occurred while getting sent pending connection requests.",
    };
  }
};

// Cancel  connection request
export const cancelConnectionRequest = async (connectionId) => {
  try {
    const connection = await ConnectionModel.findById(connectionId);
    if (!connection) {
      return {
        status: 404,
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
    return {
      status: 200,
      message: "Connection Request Canceled",
      data: connection,
    };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
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
    return {
      status: 200,
      message: "Pending requests retrived successfully",
      data: pendingRequests,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
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
    return {
      status: 200,
      message: "Connection Accepted",
      data: connection,
      isFirst: isFirst,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
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
    return {
      status: 200,
      message: "Connection Rejected",
      data: connection,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
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
        status: 404,
        message: "User not found",
      };
    }
    return {
      status: 200,
      message: "Connections retrieved successfully",
      data: user.connections,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "An error occurred while getting user connections.",
    };
  }
};

//remove accepted connection
export const removeConnection = async (loggedUserId, otherUserId) => {
  try {
    // const connection = await ConnectionModel.findById(connectionId);
    // if (!connection) {
    //   return {
    //     status: 404,
    //     message: "Connection not found",
    //   };
    // }
    // if (connection.status === "accepted") {
    //   await UserModel.findByIdAndUpdate(connection.sender, {
    //     $pull: { connections: connection.receiver },
    //   });
    //   await UserModel.findByIdAndUpdate(connection.receiver, {
    //     $pull: { connections: connection.sender },
    //   });
    // }
    // await ConnectionModel.findByIdAndRemove(connectionId);
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
    return {
      status: 200,
      message: "Connection Removed",
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "An error occurred while removing the connection.",
    };
  }
};

export const getRecommendations = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
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
        status: 200,
        message: "Recommended User data retrieved successfully",
        data: users,
      };
    }
    const users = await UserModel.find({ _id: { $in: recommendations } });
    return {
      status: 200,
      message: "Recommended User data retrieved successfully",
      data: users,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "An error occurred while getting recommendations",
    };
  }
};
