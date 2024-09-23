import {
  createMeeting,
  getAllMeetings,
  requestBookingSlotById,
  deleteMeeting,
  acceptRequestById,
  getAllRequestedByForUser,
  rejectRequestById, 
  createMeetingLink,
  validateAuth,
} from "../services/scheduleService.js";

export const createMeetingLinkController = async (req,res)=>{
  try{
    const response = await createMeetingLink(req.body.redirect_url)
    res.status(response.status).send(response);
  }catch(error){
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while retrieving meetings.",
    });
  }
}

export const validateMeetingAuthController = async (req,res)=>{
  try{
    
    const response = await validateAuth(req.body.code,req.userId)
    res.status(response.status).send(response);
  }catch(err){
    return res.status(500).json({
      status: 500,
      message: "An error occurred while retrieving meetings.",
    });
  }
}
export const createMeetingController = async (req, res) => {
  try {
    const userId = req.userId;
    const response = await createMeeting(userId, req.body);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while creating meeting.",
    });
  }
}

export const getAllMeetingsController = async (req, res) => {
  try {
    const { oneLinkId } = req.params;
    const response = await getAllMeetings(oneLinkId);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while retrieving meetings.",
    });
  }
}

export const requestBookingSlotController = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const response = await requestBookingSlotById(meetingId, req.body);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while requesting the booking slot.",
    });
  }
}

export const deleteMeetingController = async (req, res) => {
  try {
    const userId = req.userId;
    const { meetingId } = req.params;
    const response = await deleteMeeting(meetingId, userId);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while deleting the meeting.",
    });
  }
};

export const acceptRequestController = async (req, res) => {
  try {
    const { meetingId, requestId } = req.params;
    const response = await acceptRequestById(meetingId, requestId);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while accepting the request.",
    });
  }
};

export const getAllRequestedByForUserController = async (req, res) => {
  try {
    const userId = req.userId;
    const response = await getAllRequestedByForUser(userId);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while retrieving 'requested by' data for the user.",
    });
  }
};

export const rejectRequestController = async (req, res) => {
  try {
    const { meetingId, requestId } = req.params;
    const response = await rejectRequestById(meetingId, requestId);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while rejecting the request.",
    });
  }
};
