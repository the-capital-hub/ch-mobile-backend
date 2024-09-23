import {
  sendConnectionRequest,
  getPendingConnectionRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getUserConnections,
  removeConnection,
  cancelConnectionRequest,
  getSentPendingConnectionRequests,
  getRecommendations,
} from "../services/connectionService.js";

//send connect request 
export const sendConnectionRequestController = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const response = await sendConnectionRequest(senderId, receiverId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while sending connection request.",
    });
  }
};

// get sent pending connection request of a user
export const getSentPendingConnectionRequestsController = async (req, res) => {
  try {
    // const { userId } = req.params;
    const response = await getSentPendingConnectionRequests(req.userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting sent pending connection requests.",
    });
  }
};

//cancel sent connection
export const cancelConnectionRequestController = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const response = await cancelConnectionRequest(connectionId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while canceling the connection request.",
    });
  }
};

// Get pending connection requests received by a user
export const getPendingConnectionRequestsController = async (req, res) => {
  try {
    // const { userId } = req.params;
    const response = await getPendingConnectionRequests(req.userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting pending connection request.",
    });
  }
};

//accept user connections
export const acceptConnectionRequestController = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const response = await acceptConnectionRequest(connectionId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while accepting the connection request.",
    });
  }
};

//reject user connections
export const rejectConnectionRequestController = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const response = await rejectConnectionRequest(connectionId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while rejecting the connection request.",
    });
  }
};

//get all user connections
export const getUserConnectionsController = async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await getUserConnections(userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting user connections.",
    });
  }
};

// Remove a connection
export const removeConnectionController = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;
    const response = await removeConnection(userId, otherUserId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while removing the connection.",
    });
  }
};

export const getRecommendationsController = async (req, res) => {
  try {
    const response = await getRecommendations(req.params.userId);
    return res.status(response.status).send(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurrecd while getting recommendations"
    })
  }
};