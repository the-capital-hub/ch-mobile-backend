import {
  createInvestor,
  addSectorOfInterest,
  addStartupInvested,
  getInvestorById,
  uploadLogo,
  addMyInterest,
  getOnePager,
  getInvestorBySearch,
  addPastInvestments,
} from "../services/investorService.js";

//create Investor
export const createInvestorController = async (req, res) => {
  try {
    const response = await createInvestor(req.body);
    res.status(response.status).send(response);
    return response
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while creating investor.",
    });
  }
};

//add sector Interested
export const addSectorOfInterestController = async (req, res) => {
  try {
    const { investorId } = req.params;
    const response = await addSectorOfInterest(investorId, req.body);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while adding sector of interest.",
    });
  }
};

//add startup invested
export const addStartupInvestedController = async (req, res) => {
  try {
    const { investorId } = req.params;
    const response = await addStartupInvested(investorId, req.body);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while adding startup invested.",
    });
  }
};

export const getInvestorByIdController = async (req, res) => {
  try {
    const { investorId } = req.params;
    
    const response = await getInvestorById(investorId);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while fetching the investor details.",
    });
  }
};

export const uploadLogoController = async (req, res) => {
  try {
    const { logo } = req.body;
    const response = await uploadLogo(logo);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while uploading logo.",
    });
  }
};

export const addMyInterestController = async (req, res) => {
  try {
    const { investorId } = req.params;
    const response = await addMyInterest(investorId, req.body);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while adding my interest data.",
    });
  }
};

export const addPastInvestmentsController = async (req, res) => {
  try {
    const { investorId } = req.params;
    const response = await addPastInvestments(investorId, req.body);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while adding past investment data.",
    });
  }
};

export const getOnePagerController = async (req, res) => {
  try {
    const { oneLink, oneLinkId } = req.params;
    const response = await getOnePager(oneLink, oneLinkId);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while fetching the onepager.",
    });
  }
};

export const getInvestorBySearchController = async (req, res) => {
  try {
    const { searchQuery } = req.params;
    const response = await getInvestorBySearch(searchQuery);
    res.status(response.status).send(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while fetching investor.",
    });
  }
};