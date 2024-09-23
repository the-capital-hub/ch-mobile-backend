import { UserModel } from "../models/User.js";
import { StartUpModel } from "../models/startUp.js";
import { InvestorModel } from "../models/Investor.js";
import { sendMail } from "../utils/mailHelper.js";
import { cloudinary } from "../utils/uploadImage.js";
import { MilestoneModel } from "../models/Milestones.js";

const adminMail = "learn.capitalhub@gmail.com";

export const createStartup = async (startUpData) => {
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
      founderId: startUpData.founderId,
    });
    if (existingCompany) {
      existingCompany.set({
        ...startUpData,
      });
      await existingCompany.save();
      return {
        status: 200,
        message: "Startup Updated",
        data: existingCompany,
      };
    }
    let oneLink = startUpData.company.split(" ").join("").toLowerCase();
    const isOneLinkExists = await StartUpModel.countDocuments({ oneLink: oneLink });
    const newStartUp = new StartUpModel({
      ...startUpData,
      oneLink: isOneLinkExists === 1 ? oneLink + isOneLinkExists + 1 : oneLink,
    });

    await newStartUp.save();
    const { founderId } = newStartUp;
    const user = await UserModel.findByIdAndUpdate(founderId, {
      startUp: newStartUp._id,
      gender: startUpData.gender,
    });
    // const emailMessage = `
    //     A new user has requested for an account:
        
    //     User Details:
    //     User ID: ${user._id}
    //     Name: ${user.firstName} ${user.lastName}
    //     Email: ${user.email}
    //     Mobile: ${user.phoneNumber}

    //     Startup Details:
    //     Company Name: ${newStartUp.company}
    //     Sector: ${newStartUp.sector}
    //     Funding Ask: ${newStartUp.fundingAsk}
    //     Previous Funding: ${newStartUp.preFundingAsk}
    //     Number of Funding Rounds: ${newStartUp.numberOfFundingRounds}
    //   `;
    // const subject = "New Account Request";
    // const response = await sendMail(
    //   user.firstName,
    //   adminMail,
    //   user.email,
    //   subject,
    //   emailMessage
    // )
    // if (response.status === 200) {
      return {
        status: 200,
        message: "Startup Added",
        data: newStartUp,
      };
    // } else {
    //   return {
    //     status: 500,
    //     message: "Error while sending mail",
    //   };
    // }
  } catch (error) {
    console.error("Error creating company:", error);
    return {
      status: 500,
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
        status: 200,
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
        status: 200,
        message: "StartUp deleted successfully.",
        delete_status: true,
      };
    }
  } catch (err) {
    console.log(err);
    return {
      status: 500,
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
        status: 404,
        message: "User not found.",
      };
    }
    if (!user.startUp) {
       return {
         status: 404,
         message: "User does not have a startup.",
      };
     }
    const startUp = await StartUpModel.findOne({ _id:user.startUp });

    // if (!user.startUp) {
    //   return {
    //     status: 404,
    //     message: "User does not have a startup.",
    //   };
    // }
    return {
      status: 200,
      message: "StartUp details retrieved successfully.",
      data: startUp,
    };
  } catch (err) {
    console.error("Error getting StartUp details:", err);
    return {
      status: 500,
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
      company: { $regex: searchQuery, $options: 'i' },
    });
    if (startups.length === 0) {
      return {
        status: 404,
        message: "No startups found",
      };
    }
    return {
      status: 200,
      message: "Startups retrieved successfully.",
      data: startups,
    };
  } catch (error) {
    console.error("Error searching for startups:", error);
    return {
      status: 500,
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
