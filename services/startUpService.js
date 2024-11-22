import { UserModel } from "../models/User.js";
import { StartUpModel } from "../models/startUp.js";
import { InvestorModel } from "../models/Investor.js";
import { sendMail } from "../utils/mailHelper.js";
import { cloudinary } from "../utils/uploadImage.js";
import { MilestoneModel } from "../models/Milestones.js";

const adminMail = "learn.capitalhub@gmail.com";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: 'numeric', month: 'long' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};


export const createStartup = async (startUpData, userId) => {
  try {
    if (startUpData?.logo) {
      const { secure_url } = await cloudinary.uploader.upload(startUpData.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/users/profilePictures`,
        format: "webp",
        unique_filename: true,
      });
      startUpData.logo = secure_url;
    }
    let existingCompany = await StartUpModel.findOne({
      founderId: userId,
    });
    
    if (existingCompany) {
      existingCompany.set({
        ...startUpData,
      });
      await existingCompany.save();
      
      // Create curated response
      const socialLinks = [];
      if (existingCompany.socialLinks?.website) {
        socialLinks.push({ name: 'website', link: existingCompany.socialLinks.website, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/website.png' });
      }
      if (existingCompany.socialLinks?.linkedin) {
        socialLinks.push({ name: 'linkedin', link: existingCompany.socialLinks.linkedin, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/linkedin.png' });
      }
      if (existingCompany.socialLinks?.instagram) {
        socialLinks.push({ name: 'instagram', link: existingCompany.socialLinks.instagram, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/instagram.png' });
      }
      if (existingCompany.socialLinks?.twitter) {
        socialLinks.push({ name: 'twitter', link: existingCompany.socialLinks.twitter, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/twitter.png' });
      }
      if (existingCompany.socialLinks?.facebook) {
        socialLinks.push({ name: 'facebook', link: existingCompany.socialLinks.facebook, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/facebook.png' });
      }

      const curatedStartup = {
        startUpId: existingCompany._id,
        name: existingCompany.company,
        logo: existingCompany.logo || "",
        tagline: existingCompany.tagline || "",
        location: existingCompany.location || "",
        foundingDate: formatDate(existingCompany.startedAtDate) || "NA",
        lastFunding: formatDate(existingCompany.lastFunding) || "NA",
        stage: existingCompany.stage || "",
        sector: existingCompany.sector || "",
        description: existingCompany.description || "",
        numberOfEmployees: existingCompany.noOfEmployees || "NA",
        vision: existingCompany.vision || "",
        mission: existingCompany.mission || "",
        TAM: existingCompany.TAM || "NA",
        SOM: existingCompany.SOM || "NA",
        SAM: existingCompany.SAM || "NA",
        lastRoundInvestment: existingCompany.colorCard?.last_round_investment || "NA",
        totalInvestment: existingCompany.colorCard?.total_investment || "NA",
        noOfInvesters: existingCompany.colorCard?.no_of_investers || "NA",
        fundAsk: existingCompany.colorCard?.fund_ask || "NA",
        valuation: existingCompany.colorCard?.valuation || "NA",
        raisedFunds: existingCompany.colorCard?.raised_funds || "NA",
        lastYearRevenue: existingCompany.colorCard?.last_year_revenue || "NA",
        target: existingCompany.colorCard?.target || "NA",
        socialLinks: socialLinks,
        keyFocus: existingCompany.keyFocus ? existingCompany.keyFocus.split(',') : [],
        team: existingCompany.team,
        isOwnCompany: true,
      };

      return {
        status: 200,
        message: "Startup Updated",
        data: curatedStartup,
      };
    }

    // Create new startup
    let oneLink = startUpData.company.split(" ").join("").toLowerCase();
    const isOneLinkExists = await StartUpModel.countDocuments({ oneLink: oneLink });
    const newStartUp = new StartUpModel({
      ...startUpData,
      oneLink: isOneLinkExists === 1 ? oneLink + isOneLinkExists + 1 : oneLink,
      founderId: userId,
    });

    await newStartUp.save();
    await UserModel.findByIdAndUpdate(userId, {
      startUp: newStartUp._id,
    });

    // Create curated response for new startup
    const socialLinks = [];
    if (newStartUp.socialLinks?.website) {
      socialLinks.push({ name: 'website', link: newStartUp.socialLinks.website, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/website.png' });
    }
    if (newStartUp.socialLinks?.linkedin) {
      socialLinks.push({ name: 'linkedin', link: newStartUp.socialLinks.linkedin, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/linkedin.png' });
    }
    if (newStartUp.socialLinks?.instagram) {
      socialLinks.push({ name: 'instagram', link: newStartUp.socialLinks.instagram, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/instagram.png' });
    }
    if (newStartUp.socialLinks?.twitter) {
      socialLinks.push({ name: 'twitter', link: newStartUp.socialLinks.twitter, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/twitter.png' });
    }
    if (newStartUp.socialLinks?.facebook) {
      socialLinks.push({ name: 'facebook', link: newStartUp.socialLinks.facebook, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/facebook.png' });
    }

    const curatedStartup = {
      startUpId: newStartUp._id,
      name: newStartUp.company,
      logo: newStartUp.logo || "",
      tagline: newStartUp.tagline || "",
      location: newStartUp.location || "",
      foundingDate: formatDate(newStartUp.startedAtDate) || "NA",
      lastFunding: formatDate(newStartUp.lastFunding) || "NA",
      stage: newStartUp.stage || "",
      sector: newStartUp.sector || "",
      description: newStartUp.description || "",
      numberOfEmployees: newStartUp.noOfEmployees || "NA",
      vision: newStartUp.vision || "",
      mission: newStartUp.mission || "",
      TAM: newStartUp.TAM || "NA",
      SOM: newStartUp.SOM || "NA",
      SAM: newStartUp.SAM || "NA",
      lastRoundInvestment: newStartUp.colorCard?.last_round_investment || "NA",
      totalInvestment: newStartUp.colorCard?.total_investment || "NA",
      noOfInvesters: newStartUp.colorCard?.no_of_investers || "NA",
      fundAsk: newStartUp.colorCard?.fund_ask || "NA",
      valuation: newStartUp.colorCard?.valuation || "NA",
      raisedFunds: newStartUp.colorCard?.raised_funds || "NA",
      lastYearRevenue: newStartUp.colorCard?.last_year_revenue || "NA",
      target: newStartUp.colorCard?.target || "NA",
      socialLinks: socialLinks,
      keyFocus: newStartUp.keyFocus ? newStartUp.keyFocus.split(',') : [],
      team: newStartUp.team,
      isOwnCompany: true,
    };

    return {
      status: true,
      message: "Startup Added",
      data: curatedStartup,
    };

  } catch (error) {
    console.error("Error creating company:", error);
    return {
      status: false,
      message: "An error occurred while creating the company.",
    };
  }
};

export const deleteStartUp = async (startUpId, userId) => {
  try {
    const user = await UserModel.findOne({ _id: userId });
    const startUp = await StartUpModel.findOne({ _id: startUpId });

    if (!user._id.equals(startUp.founderId)) {
      await UserModel.findOneAndUpdate({ _id: userId }, { startUp: null });
      return {
        status: true,
        message: "StartUp deleted successfully.",
        delete_status: true,
      };
    }
    if (user._id.equals(startUp.founderId)) {
      console.log("success");
      await StartUpModel.findOneAndDelete({
        _id: startUpId,
        founderId: userId,
      });
      return {
        status: true,
        message: "StartUp deleted successfully.",
        delete_status: true,
      };
    }
  } catch (err) {
    console.log(err);
    return {
      status: false,
      message: "An error occurred while creating the company.",
    };
  }
};

export const getOnePager = async (oneLink) => {
  try {
    const company = await StartUpModel.findOne({ oneLink });
    if (!company) {
      return {
        status: 404,
        message: "StartUp not found.",
      };
    }
    return {
      status: 200,
      message: "StartUp details retrieved successfully.",
      data: company,
    };
  } catch (err) {
    console.error("Error getting StartUp details:", err);
    return {
      status: 500,
      message: "An error occurred while getting StartUp details.",
    };
  }
};

export const updateStartUpData = async (founderId, introductoryMessage) => {
  try {
    const startUp = await StartUpModel.findOne({ founderId });
    if (!startUp) {
      return {
        status: 404,
        message: "No startUp found",
      };
    }
    const updatedData = await StartUpModel.findOneAndUpdate(
      { founderId },
      {
        $push: {
          previousIntroductoryMessage: startUp.introductoryMessage || introductoryMessage,
        },
        introductoryMessage: introductoryMessage,
      },
      { new: true }
    );
    return {
      status: 200,
      data: updatedData,
      message: `${startUp.company} updated succesfully`,
    };
  } catch (error) {
    console.error("Error updating StartUp details:", error);
    return {
      status: 500,
      message: "An error occurred while updating StartUp details.",
    };
  }
};

export const updateOnePager = async ({ _id, ...data }) => {
  try {
    const newOnePage = await StartUpModel.findByIdAndUpdate(_id, data, {
      new: true,
    });
    return {
      status: 200,
      message: "One Pager updated succesfully",
      data: newOnePage,
    };
  } catch (error) {
    console.error("Error updating One Pager details:", error);
    return {
      status: 500,
      message: "An error occurred while updating One Pager details.",
    };
  }
};

export const investNowService = async (args) => {
  try {
    const { fromUserName, fromUserEmail, fromUserMobile, toUserId,commitmentAmount } = args;
    const toUser = await UserModel.findById(toUserId);
    if (!toUser) {
      return {
        status: 404,
        message: "Recipient user not found.",
      };
    }

    const emailMessage = `
      Hello ${toUser.firstName},
      
      You have received an investment proposal from ${fromUserName}.
      Commitment amount is ${commitmentAmount}

      Contact Details:
      Email: ${fromUserEmail}
      Mobile: ${fromUserMobile}
      
      Regards,
      CapitalHub
    `;
    const response = await sendMail(
      "Capital HUB",
      toUser.email,
      fromUserEmail,
      "Investment Proposal",
      emailMessage
    );

    if (response.status === 200) {
      const startup = await StartUpModel.findOne({ founderId: toUserId });
      if (startup) {
        startup.investorProposals.push({
          name: fromUserName,
          email: fromUserEmail,
          phone: fromUserMobile,
        });
        await startup.save();
      }
      return {
        status: 200,
        message: "Investment proposal email sent successfully.",
      };
    } else {
      return {
        status: 500,
        message: "An error occurred while sending the investment proposal email.",
      };
    }
  } catch (error) {
    console.error("Error sending investment proposal email:", error);
    return {
      status: 500,
      message: "An error occurred while sending the investment proposal email.",
    };
  }
};

//Get startup by it's id : 06-08-2024
export const getStartUpById = async (_id) => {
  console.log(`Received ID in getStartUpById: ${_id}`); // Debug log
  try {
    const startUp = await StartUpModel.findById(_id);
    if (startUp) {
      return {
        status: 200,
        messsage: "Startup found successfully.",
        data: startUp,
      }
    };
  } catch (error) {
    console.error("Error getting StartUp details:", error);
    return {
      status: 500,
      message: "Error getting startup"
    };
  }
};



export const getStartupByFounderId = async (founderId) => {
  try {
    const user = await UserModel.findOne({ _id: founderId }).populate(
      "startUp"
    );
    if (!user) {
      return {
        status: false,
        message: "User not found.",
      };
    }
    if (!user.startUp) {
       return {
         status: false,
         message: "User does not have a startup.",
      };
    }
    const startUp = await StartUpModel.findOne({ _id:user.startUp });

    let isOwnCompany;

    if (startUp.founderId == founderId){
      isOwnCompany = true;
    }
    else{
      isOwnCompany = false;
    }

    const socialLinks = [];
      
    if (startUp.socialLinks.website) {
      socialLinks.push({ name: 'website', link: startUp.socialLinks.website, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/website.png' });
  }
  if (startUp.socialLinks.linkedin) {
      socialLinks.push({ name: 'linkedin', link: startUp.socialLinks.linkedin, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/linkedin.png' });
  }
  if (startUp.socialLinks.instagram) {
      socialLinks.push({ name: 'instagram', link: startUp.socialLinks.instagram, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/instagram.png' });
  }
  if (startUp.socialLinks.twitter) {
      socialLinks.push({ name: 'twitter', link: startUp.socialLinks.twitter, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/twitter.png' });
  }
  if (startUp.socialLinks.facebook) {
      socialLinks.push({ name: 'facebook', link: startUp.socialLinks.facebook, logo: 'https://thecapitalhub.s3.ap-south-1.amazonaws.com/facebook.png' });
  }

    const curatedStartup = {
      startUpId : startUp._id,
      name: startUp.company,
      logo: startUp.logo || "",
      tagline : startUp.tagline || "",
      location: startUp.location || "",
      foundingDate :formatDate(startUp.startedAtDate) || "NA",
      lastFunding : formatDate(startUp.lastFunding) || "NA",
      stage : startUp.stage || "",
      sector: startUp.sector || "",
      description: startUp.description || "",
      numberOfEmployees: startUp.noOfEmployees || "NA",
      vision: startUp.vision || "",
      mission:startUp.mission || "",
      TAM: startUp.TAM || "NA",
      SOM: startUp.SOM || "NA",
      SAM: startUp.SAM || "NA",
      lastRoundInvestment: startUp.colorCard.last_round_investment || "NA",
      totalInvestment: startUp.colorCard.total_investment || "NA",
      noOfInvesters: startUp.colorCard.no_of_investers || "NA",
      fundAsk: startUp.colorCard.fund_ask || "NA",
      valuation: startUp.colorCard.valuation || "NA",
      raisedFunds: startUp.colorCard.raised_funds || "NA",
      lastYearRevenue: startUp.colorCard.last_year_revenue || "NA",
      target: startUp.colorCard.target || "NA",
      socialLinks: socialLinks,
      keyFocus: startUp.keyFocus ? startUp.keyFocus.split(',') : [],
      team : startUp.team,
      isOwnCompany: isOwnCompany,
    }

    return {
      status: true,
      message: "StartUp details retrieved successfully.",
      data: curatedStartup,
    };
  } catch (err) {
    console.error("Error getting StartUp details:", err);
    return {
      status: false,
      message: "An error occurred while getting StartUp details.",
    };
  }
};

// Get All Startups
export const getAllStartups = async () => {
  try {
    const startups = await StartUpModel.find();
    return {
      status: 200,
      message: "Startups retrieved successfully.",
      data: startups,
    };
  } catch (error) {
    console.error("Error getting all startups:", error);
    return {
      status: 500,
      message: "An error occurred while getting all startups.",
    };
  }
};

export const getStartupsBySearch = async (searchQuery) => {
  try {
    const startups = await StartUpModel.find({
      company: { $regex: searchQuery, $options: 'i'},
    }).select('_id company');
    if (startups.length === 0) {
      return {
        status: false,
        message: "No startups found",
      };
    }
    return {
      status: true,
      message: "Startups retrieved successfully.",
      data: startups,
    };
  } catch (error) {
    console.error("Error searching for startups:", error);
    return {
      status: false,
      message: "An error occurred while searching for startups.",
    };
  }
};

export const createMilestone = async (milestoneData) => {
  try {
    const milestone = new MilestoneModel({
      ...milestoneData
    });
    await milestone.save();
    return {
      status: 200,
      message: "Minestone Added",
      data: milestone,
    }
  } catch (error) {
    console.error("Error creating minestone:", error);
    return {
      status: 500,
      message: "An error occurred while creating minestone.",
    };
  }
}

export const getMileStone = async (userId) => {
  try {
    const milestones = await MilestoneModel.find();
    const user = await UserModel.findById(userId);
    let userMilestones = [];
    if (user.isInvestor === "true") {
      const investor = await InvestorModel.findById(user.investor);
      userMilestones = investor.milestones;
    } else {
      const startUp = await StartUpModel.findById(user.startUp);
      userMilestones = startUp.milestones;
    }
    userMilestones.push("653b906d69fc4c33f7a8f71c");
    const filteredMilestones = milestones.filter((milestone) =>
      !userMilestones.includes(milestone._id),
    );
    return {
      status: 200,
      message: "Minestone retrived",
      data: filteredMilestones,
    }
  } catch (error) {
    console.error("Error getting minestone:", error);
    return {
      status: 500,
      message: "An error occurred while getting minestone.",
    };
  }
}

export const addMilestoneToUser = async (userId, milestoneId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      };
    }
    if (user.isInvestor === "true") {
      const investor = await InvestorModel.findById(user.investor);
      const milestone = await MilestoneModel.findById(milestoneId);
      if (!milestone) {
        return {
          status: 404,
          message: "Milestone not found.",
        };
      }
      if (investor.milestones?.includes(milestoneId)) {
        return {
          status: 400,
          message: "Milestone is already associated with the startup.",
        };
      }
      investor.milestones.push(milestone);
      await investor.save();
    } else {
      const startUp = await StartUpModel.findById(user.startUp);
      const milestone = await MilestoneModel.findById(milestoneId);
      if (!milestone) {
        return {
          status: 404,
          message: "Milestone not found.",
        };
      }
      if (startUp.milestones?.includes(milestoneId)) {
        return {
          status: 400,
          message: "Milestone is already associated with the startup.",
        };
      }
      startUp.milestones.push(milestone);
      await startUp.save();
    }

    return {
      status: 200,
      message: "Milestone added to the user successfully.",
      data: user,
    };
  } catch (error) {
    console.error("Error adding milestone to the user:", error);
    return {
      status: 500,
      message: "An error occurred while adding milestone to the user.",
    };
  }
}

export const getUserMilestones = async (oneLinkId) => {
  try {
    const user = await UserModel.findOne({ oneLinkId: oneLinkId });
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      };
    }
    if (user.isInvestor === "true") {
      const investor = await InvestorModel.findById(user.investor);
      if (!investor) {
        return {
          status: 404,
          message: "Startup not found for the user.",
        };
      }
      const milestoneIds = investor.milestones;
      milestoneIds.push("653b906d69fc4c33f7a8f71c");
      const milestones = await MilestoneModel.find({ _id: { $in: milestoneIds } });
      return {
        status: 200,
        message: "Milestones retrieved successfully for the user's startup.",
        data: {
          milestones,
          userJoinedDate: user.createdAt,
          startUpFoundedDate: investor.startedAtDate,
        },
      };
    } else {
      const startUp = await StartUpModel.findById(user.startUp);
      if (!startUp) {
        return {
          status: 404,
          message: "Startup not found for the user.",
        };
      }
      const milestoneIds = startUp.milestones;
      milestoneIds.push("653b906d69fc4c33f7a8f71c");
      const milestones = await MilestoneModel.find({ _id: { $in: milestoneIds } });
      return {
        status: 200,
        message: "Milestones retrieved successfully for the user's startup.",
        data: {
          milestones,
          userJoinedDate: user.createdAt,
          startUpFoundedDate: startUp.startedAtDate,
        },
      };
    }

  } catch (error) {
    console.error("Error getting milestones for the user:", error);
    return {
      status: 500,
      message: "An error occurred while getting milestones for the user.",
    };
  }
}

export const deleteUserMilestone = async (oneLinkId, milestoneId) => {
  try {
    const user = await UserModel.findOne({ oneLinkId: oneLinkId });
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      };
    }
    if (user.isInvestor === "true") {
      const investor = await InvestorModel.findById(user.investor);
      investor.milestones = investor.milestones.filter((id) => id.toString() !== milestoneId);
      await investor.save();
    } else {
      const startUp = await StartUpModel.findById(user.startUp);
      startUp.milestones = startUp.milestones.filter((id) => id.toString() !== milestoneId);
      await startUp.save();
    }

    return {
      status: 200,
      message: "Milestone deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting user milestone:", error);
    return {
      status: 500,
      message: "An error occurred while deleting user milestoner.",
    };
  }
}
