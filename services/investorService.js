import { UserModel } from "../models/User.js";
import { InvestorModel } from "../models/Investor.js";
import { sendMail } from "../utils/mailHelper.js";
import { cloudinary } from "../utils/uploadImage.js";

const adminMail = "learn.capitalhub@gmail.com";

//create investor
export const createInvestor = async (investorData) => {
  try {
    if (investorData?.logo) {
      const { secure_url } = await cloudinary.uploader.upload(investorData.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/users/profilePictures`,
        format: "webp",
        unique_filename: true,
      });
      investorData.logo = secure_url;
    }
    let existingCompany = await InvestorModel.findOne({
      founderId: investorData.founderId,
    });
    if (existingCompany) {
      existingCompany.set({
        ...investorData,
      });
      await existingCompany.save();
      return {
        status: 200,
        message: "Investor Updated",
        data: existingCompany,
      };
    }

    let oneLink = investorData.companyName.split(" ").join("").toLowerCase();
    const isOneLinkExists = await InvestorModel.countDocuments({ oneLink: oneLink });
    const newInvestor = new InvestorModel({
      ...investorData,
      oneLink: isOneLinkExists === 1 ? oneLink + isOneLinkExists + 1 : oneLink,
    });

    await newInvestor.save();
    const { founderId } = newInvestor;
    const user = await UserModel.findByIdAndUpdate(founderId, {
      investor: newInvestor._id,
      gender: investorData.gender,
      designation: investorData.designation,
      education: investorData.education,
      experience: investorData.experience,
      location: investorData.location,
    });
    const emailMessage = `
        A new user has requested for an account:
        
        Investor Details:
        User ID: ${user._id}
        Name: ${user.firstName} ${user.lastName}
        Email: ${user.email}
        Mobile: ${user.phoneNumber}
        Company Name: ${newInvestor.companyName}
        Industry: ${newInvestor.industry}
        Maximum Invest: ${newInvestor.maximumInvest}
        Minimum Invest: ${newInvestor.minimumInvest}
        Portfolio: ${newInvestor.portfolio}
      `;
    const subject = "New Account Request";
    const response = await sendMail(
      user.firstName,
      adminMail,
      user.email,
      subject,
      emailMessage
    )
    if (response.status === 200) {
      return {
        status: 200,
        message: "Investor Added",
        data: newInvestor,
      };
    } else {
      return {
        status: 500,
        message: "Error while sending mail",
      };
    }
  } catch (error) {
    console.error("Error creating investor:", error);
    return {
      status: 500,
      message: "An error occurred while creating the investor.",
    };
  }
};

//add sector intrested
export const addSectorOfInterest = async (investorId, sectorData) => {
  try {
    const investor = await InvestorModel.findById(investorId);
    if (!investor) {
      return {
        status: 404,
        message: "Investor not found",
      };
    }
    if (sectorData.logo && !sectorData.isExisting) {
      const { secure_url } = await cloudinary.uploader.upload(sectorData.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
        format: "webp",
        unique_filename: true,
      });
      sectorData.logo = secure_url;
    }
    investor.sectorInterested.push(sectorData);
    await investor.save();
    return {
      status: 200,
      message: "Sector of interest added",
      data: investor,
    };
  } catch (error) {
    console.error("Error adding sector of interest:", error);
    return {
      status: 500,
      message: "An error occurred while adding the sector of interest.",
    };
  }
};

//add startup invested
export const addStartupInvested = async (investorId, startupData) => {
  try {
    const investor = await InvestorModel.findById(investorId);

    if (!investor) {
      return {
        status: 404,
        message: "Investor not found",
      };
    }
    if (startupData.logo && !startupData.isExisting) {
      const { secure_url } = await cloudinary.uploader.upload(startupData.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
        format: "webp",
        unique_filename: true,
      });
      startupData.logo = secure_url;
    }
    investor.startupsInvested.push(startupData);
    await investor.save();
    return {
      status: 200,
      message: "Startup invested added",
      data: investor,
    };
  } catch (error) {
    console.error("Error adding startup invested:", error);
    return {
      status: 500,
      message: "An error occurred while adding the startup invested.",
    };
  }
};

//get investor by id
export const getInvestorById = async (investorId) => {
  try {
    const investor = await InvestorModel.findOne({ _id: investorId })
    // .populate({
    //   path: 'founderId',
    //   model: 'Users', 
    // });
    if (!investor) {
       const investorData = await InvestorModel.findOne({
        founderId: investorId,
      });
      if (!investorData) {
        return {
          status: 404,
          message: "Investor Data not found",
        };
      }
      return {
        status: 200,
        message: "Investor Data found",
        data: investorData,
      };
    }
    return {
      status: 200,
      message: "Investor Data found",
      data: investor,
    };
  } catch (error) {
    console.error("Error getting investor by ID:", error);
    return {
      status: 500,
      message: "An error occurred while fetching the investor details.",
    };
  }
};

export const uploadLogo = async (logo) => {
  try {
    const { secure_url } = await cloudinary.uploader.upload(logo, {
      folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
      format: "webp",
      unique_filename: true,
    });
    return {
      status: 200,
      message: "Upload successfull",
      url: secure_url,
    };
  } catch (error) {
    console.error("Error uploading:", error);
    return {
      status: 500,
      message: "An error occurred while uploading.",
    };
  }
};

export const addMyInterest = async (investorId, data) => {
  try {
    const investor = await InvestorModel.findById(investorId);

    if (!investor) {
      return {
        status: 404,
        message: "Investor not found",
      };
    }
    if (data.logo) {
      const { secure_url } = await cloudinary.uploader.upload(data.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
        format: "webp",
        unique_filename: true,
      });
      data.logo = secure_url;
    }
    investor.myInterests.push(data);
    await investor.save();
    return {
      status: 200,
      message: "My Interest added",
      data: investor,
    };
  } catch (error) {
    console.error("Error adding My Interests:", error);
    return {
      status: 500,
      message: "An error occurred while adding my interest data.",
    };
  }
};

export const getOnePager = async (oneLink, oneLinkId) => {
  try {
    const company = await InvestorModel.findOne({ oneLink: oneLink })
    const investor = await UserModel.findOne({ oneLinkId });
    if (!company || !investor) {
      return {
        status: 404,
        message: "Investor Data not found",
      };
    }
    return {
      status: 200,
      message: "Investor Data found",
      data: {
        company,
        investor
      },
    };
  } catch (error) {
    console.error("Error getting investor by ID:", error);
    return {
      status: 500,
      message: "An error occurred while fetching the onepager.",
    };
  }
};

export const getInvestorBySearch = async (searchQuery) => {
  try {
    const startups = await InvestorModel.find({
      companyName: { $regex: searchQuery, $options: 'i' },
    });
    if (startups.length === 0) {
      return {
        status: 404,
        message: "No investor company found",
      };
    }
    return {
      status: 200,
      message: "Investor company retrieved successfully.",
      data: startups,
    };
  } catch (error) {
    console.error("Error searching for investor:", error);
    return {
      status: 500,
      message: "An error occurred while searching for investor.",
    };
  }
};


export const addPastInvestments = async (investorId, data) => {
  try {
    const investor = await InvestorModel.findById(investorId);

    if (!investor) {
      return {
        status: 404,
        message: "Investor not found",
      };
    }
    if (data.logo) {
      const { secure_url } = await cloudinary.uploader.upload(data.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
        format: "webp",
        unique_filename: true,
      });
      data.logo = secure_url;
    }
    investor.pastInvestments.push(data);
    await investor.save();
    return {
      status: 200,
      message: "Past Investment added",
      data: investor,
    };
  } catch (error) {
    console.error("Error adding Past Investments:", error);
    return {
      status: 500,
      message: "An error occurred while adding past investment data.",
    };
  }
};
