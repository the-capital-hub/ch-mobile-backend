import { UserModel } from "../models/User.js";
//import { comparePassword } from "../utils/passwordManager.js";
import { StartUpModel } from "../models/startUp.js";
import { InvestorModel } from "../models/Investor.js";
import { cloudinary } from "../utils/uploadImage.js";
import jwt from "jsonwebtoken";
import { secretKey } from "../constants/config.js";
import { sendMail } from "../utils/mailHelper.js";
import bcrypt from "bcrypt";
import { comparePassword, hashPassword } from "../utils/passwordManager.js";

const adminMail = "learn.capitalhub@gmail.com";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: 'numeric', month: 'long' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};


export const getUsersService = async (info) => {
  try {
    const products = await UserModel.find({}).toArray();
    return products;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return [];
  }
};

export const registerUserService = async (user) => {
  try {
    const existingUser = await UserModel.findOne({
      $or: [{ email: user.email }, { phoneNumber: user.phoneNumber }],
    });
    if (existingUser) {
      throw new Error("Existing user. Please log in");
    }
    const newUser = new UserModel(user);
    await newUser.save();
    return newUser;
  } catch (error) {
    throw error;
  }
};

export const getUserByUserName = async (username) => {
  try {
    if (!username) {
      console.log("No username provided.");
      return {
        status: 404,
        message: "No user exists",
      };
    }

    console.log(`Searching for user with username: ${username}`);
    const response = await UserModel.findOne({ userName: username });

    if (!response) {
      console.log(`No user found with username: ${username}`);
      return {
        status: 404,
        message: "No user exists",
      };
    }

    console.log(`User found: ${response}`);
    return {
      status: 200,
      message: response,
    };
  } catch (error) {
    console.error("An error occurred while finding the user", error);
    return {
      status: 500,
      message: "Internal server error",
    };
  }
};


export const loginUserService = async ({ phoneNumber, password }) => {
  const user = await UserModel.findOne({
    phoneNumber,
    userStatus: "active",
  }).populate({
    path: "startUp",
    select: "company logo",
  });

  if (!user) {
    const existingUser = await UserModel.findOne({
      $or: [{ email: phoneNumber }, { userName: phoneNumber }],
    });
    console.log(existingUser)
    if(!existingUser) throw new Error("Invalid credentials");
    await comparePassword(password, existingUser.password);
    return existingUser
  } else{
    return user;
  }  
};

//get User by id
export const getUserById = async (userId) => {
  try {
    let user = await UserModel.findOne({ oneLinkId: userId }).populate('startUp');
    if (!user) {
      user = await UserModel.findById(userId).populate(['startUp', 'investor']);
    }
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      };
    }
    user.password = undefined;
    return {
      status: 200,
      message: "User details retrieved successfully.",
      data: user,
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return {
      status: 500,
      message: "An error occurred while getting the user.",
    };
  }
};

// Update User
export const updateUserData = async ({ userId, newData }) => {
  try {

    const base64ToBuffer = (base64String) => {
      const base64Data = base64String.replace(/^data:image\/jpg;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    };


    if (newData?.profilePicture) {
      const profilePictureBuffer = base64ToBuffer(newData.profilePicture);
      const profilePictureBase64 = `data:image/webp;base64,${profilePictureBuffer.toString('base64')}`;
      
      const { secure_url } = await cloudinary.uploader.upload(profilePictureBase64, {
        folder: `${process.env.CLOUDINARY_FOLDER}/startUps/logos`,
        format: "webp",
        unique_filename: true,
      });

      newData.profilePicture = secure_url; 
    }
    const data = await UserModel.findByIdAndUpdate(
      userId,
      { ...newData },
      { new: true }
    );
    return {
      status: 200,
      message: "User updated succesfully",
      data,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "An error occurred while updating the bio.",
    };
  }
};

//blockuser
export const blockUser = async (userId, blockedUserId) => {
  try {
    // Find the user who wants to block another user
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }

    // Check if the user is trying to block themselves
    if (userId === blockedUserId) {
      return {
        status: 400,
        message: "Cannot block yourself",
      };
    }

    // Add the blockedUserId to the user's blocked list
    if (!user.blockedUsers.includes(blockedUserId)) {
      user.blockedUsers.push(blockedUserId);
      await user.save();
    }

    return {
      status: 200,
      message: "User blocked successfully",
    };
  } catch (error) {
    console.error("Error blocking user:", error);
    return {
      status: 500,
      message: "An error occurred while blocking the user.",
    };
  }
};


export const unblockUser = async (userId, unblockUserId) => {
  try {
    // Find the user who wants to unblock the blocked user
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }

    // Check if the user is trying to unblock themselves
    if (userId === unblockUserId) {
      return {
        status: 400,
        message: "Cannot unblock yourself",
      };
    }

    // Check if the id belongs to the blocked list
    if (!user.blockedUsers.includes(unblockUserId)) {
      return {
        status: 404,
        message: "The user is already unblocked",
      };
    }

    // Remove unblockUserId from blockedUsers array and update the document
    await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { blockedUsers: unblockUserId } },
      { new: true }
    );

    return {
      status: 200,
      message: "User unblocked successfully",
    };
  } catch (error) {
    console.error("Error unblocking user:", error);
    return {
      status: 500,
      message: "An error occurred while unblocking the user.",
    };
  }
};


//get User by id with request body
export const getUserByIdBody = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    return {
      status: 200,
      message: "User details retrieved successfully.",
      data: user,
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return {
      status: 500,
      message: "An error occurred while getting the user.",
    };
  }
};




// Start up data

export const getStartUpData = async (userId) => {
  try {
    const startUp = await StartUpModel.findOne({ founderId: userId });
    if (!startUp) {
      return {
        status: 404,
        message: "StartUp not found.",
      };
    }
    return {
      status: 200,
      message: "StartUp details retrieved successfully.",
      data: startUp,
    };
  } catch (error) {
    console.error("Error getting StartUp:", error);
    return {
      status: 500,
      message: "An error occurred while getting the StartUp.",
    };
  }
};

export const updateUserById = async (userId, newData) => {
  try {
    const data = await UserModel.findByIdAndUpdate(userId, { ...newData }, { new: true });
    return {
      status: 200,
      message: "User updated succesfully",
      data,
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "An error occurred while updating the bio.",
    };
  }
};

export const changePassword = async (userId, { newPassword, oldPassword }) => {
  try {
    const user = await UserModel.findById(userId);
    const checkPassword = bcrypt.compare(oldPassword, user.password);
    if (!checkPassword) {
      return {
        status: 401,
        message: "Invalid Password",
      };
    }
    user.password = await hashPassword(newPassword);
    await user.save();
    return {
      status: 200,
      message: "Password Changed Successfully",
    };
  } catch (error) {
    return {
      status: 500,
      message: "An error occurred while updating the password.",
    };
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return {
        status: 404,
        message: "User Not Found",
      };
    }
    const payload = {
      userId: user._id.toString(),
    };
    const resetToken = jwt.sign(payload, secretKey, {
      expiresIn: "1h",
    }); 
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    const resetPasswordMessage = `
      <p>You've requested to reset your password. If you didn't make this request, please ignore this email.</p>
  
      <p>To reset your password, click the button below:</p>
      <p style="text-align: center;"> 
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
    </p>
      <p>If the above button doesn't work, copy and paste the following URL into your browser:</p>
      <p>${resetLink}</p>
    
      <p>This link will expire in 1 hour for security reasons.</p>
    
      <p>If you have any questions or need further assistance, please contact our support team.</p>
    
      <p>Regards,<br>The Capital Hub</p>
    `;
    const subject = "Password Reset Request";
    const response = await sendMail(
      "The Capital Hub",
      user.email,
      adminMail,
      subject,
      resetPasswordMessage
    );
    if (response.status === 200) {
      return {
        status: 200,
        message: "Password reset email sent successfully",
      };
    } else {
      return {
        status: 500,
        message: "Error sending password reset email",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "Error requesting password reset",
    };
  }
};

export const resetPassword = async (token, newPassword) => {
  console.log("token, newPassword", token, newPassword);
  try {
    const decodedToken = jwt.verify(token, secretKey);
    if (!decodedToken || !decodedToken.userId) {
      return {
        status: 400,
        message: "Invalid or expired reset token",
      };
    }
    const user = await UserModel.findById(decodedToken.userId);
    if (!user) {
      return {
        status: 400,
        message: "User not found",
      };
    }
    user.password = newPassword;
    await user.save();
    return {
      status: 200,
      message: "Password reset successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      status: 500,
      message: "Error resetting password",
    };
  }
};

//search user/ company
export const searchUsers = async (searchQuery) => {
  const regex = new RegExp(`^${searchQuery}`, "i");
  try {
    const users = await UserModel.find({
      $and: [
        {
          $or: [
            { firstName: { $regex: regex } },
            { lastName: { $regex: regex } },
          ],
        },
        { userStatus: "active" },
      ],
    });

    const companyIds = users.map((user) => user.startUp);
    const company = await StartUpModel.find({
      $or: [
        { company: { $regex: regex } },
        { oneLink: { $regex: regex } },
        { _id: { $in: companyIds } }
      ],
    });

    const investorCompanyIds = users.map((user) => user.investor);
    const investor = await InvestorModel.aggregate([
      {
        $match: {
          $or: [
            { companyName: { $regex: regex } },
            { oneLink: { $regex: regex } },
            { _id: { $in: investorCompanyIds } }
          ],
        },
      },
      {
        $addFields: {
          company: "$companyName",
          isInvestor: true,
        },
      },
    ]);

    return {
      status: 200,
      data: {
        users: users,
        company: company.concat(investor),
      },
    };
  } catch (error) {
    console.error("Error searching for users:", error);
    return {
      status: 500,
      message: "Error searching for users",
    };
  }
};

// add education
export const addEducation = async (userId, educationData) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    if (educationData?.logo) {
      const { secure_url } = await cloudinary.uploader.upload(educationData.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
        format: "webp",
        unique_filename: true,
      });
      educationData.logo = secure_url;
    }
    user.recentEducation.push(educationData);
    await user.save();
    return {
      status: 200,
      message: "Education added",
      data: user,
    };
  } catch (error) {
    console.error("Error adding recent education:", error);
    return {
      status: 500,
      message: "An error occurred while adding education.",
    };
  }
};

// add experince
export const addExperience = async (userId, experienceData) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    if (experienceData?.logo) {
      const { secure_url } = await cloudinary.uploader.upload(experienceData.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
        format: "webp",
        unique_filename: true,
      });
      experienceData.logo = secure_url;
    }
    user.recentExperience.push(experienceData);
    await user.save();
    return {
      status: 200,
      message: "Experience added",
      data: user,
    };
  } catch (error) {
    console.error("Error adding recent experience:", error);
    return {
      status: 500,
      message: "An error occurred while adding experience.",
    };
  }
};

export const addStartupToUser = async (userId, startUpId) => {
  try {
    const user = await UserModel.findOneAndUpdate(
      { _id: userId },
      { $set: { startUp: startUpId } },
      { new: true }
    );
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      };
    }

    let isFirst = false;
    const achievementId = "6564687349186bca517cd0cd";
    if (!user.achievements.includes(achievementId)) {
      user.achievements.push(achievementId);
      await user.save();
      isFirst = true;
    }

    return {
      status: 200,
      message: "Startup added to user successfully.",
      data: user,
      isFirst,
    };
  } catch (error) {
    console.error("Error adding startups to user:", error);
    return {
      status: 500,
      message: "An error occurred while adding startups to user.",
    };
  }
};

export const addUserAsInvestor = async (userId, investorId) => {
  try {
    const user = await UserModel.findOneAndUpdate(
      { _id: userId },
      { $set: { investor: investorId } },
      { new: true }
    );
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      };
    }
    return {
      status: 200,
      message: "Investor added to user successfully.",
      data: user,
    };
  } catch (error) {
    console.error("Error adding user as investor:", error);
    return {
      status: 500,
      message: "An error occurred while adding user as investor.",
    };
  }
};

export const getExplore = async (filters) => {
  try {
    const {
      type,
      sector,
      gender,
      city,
      size,
      yearsOfExperience,
      previousExits,
      diversityMetrics,
      sectorPreference,
      investmentSize,
      investmentStage,
      fundingRaised,
      productStage,
      stage,
      age,
      education,
      searchQuery,
    } = filters;

    // for startups
    if (type === "startup") {
      const query = {};
      if (sector) {
        query.sector = sector
      }
      if (city) {
        query.location = city;
      }
      if (size) {
        query.noOfEmployees = { $gte: size };
      }
      if (fundingRaised) {
        query.fundingRaised = fundingRaised;
      }
      if (productStage) {
        query.productStage = productStage;
      }
      if (stage) {
        query.stage = stage;
      }
      if (age) {
        query.age = age;
      }
      if (searchQuery) {
        query.company = { $regex: new RegExp(`^${searchQuery}`, 'i') };
      }
      const startups = await StartUpModel.find(query).populate("founderId");

      const curatedStartups = startups.map(startup => {
        const socialLinks = [];
      
        if (startup.socialLinks.website) {
          socialLinks.push({ name: 'website', link: startup.socialLinks.website, logo:'https://thecapitalhub.s3.ap-south-1.amazonaws.com/website.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115647Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=8b949ec5ceae02ea43fd45636402114317d2458a34e4ed8cffac33cd6b680d42' });
        }
        if (startup.socialLinks.linkedin) {
          socialLinks.push({ name: 'linkedin', link: startup.socialLinks.linkedin, logo:"https://thecapitalhub.s3.ap-south-1.amazonaws.com/linkedin.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115636Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=ed531ad01ba21f7e5d16c0c96319b286f56874090761ecc55da72fce80cff419" });
        }
        if (startup.socialLinks.instagram) {
          socialLinks.push({ name: 'instagram', link: startup.socialLinks.instagram, logo:"https://thecapitalhub.s3.ap-south-1.amazonaws.com/instagram.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115632Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=7aa9660c6e510f92a28cbe6e02c69988eaac4855b232d0405ae94d1cbf5d7947" });
        }
        if (startup.socialLinks.twitter) {
          socialLinks.push({ name: 'twitter', link: startup.socialLinks.twitter, logo:"https://thecapitalhub.s3.ap-south-1.amazonaws.com/twitter.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115642Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=ca1832235485ed1cfd8816730c4e71d8c6bc7ed8310b119eb55b238a5d0278bf" });
        }
        if (startup.socialLinks.facebook) {
          socialLinks.push({ name: 'facebook', link: startup.socialLinks.facebook, logo:"https://thecapitalhub.s3.ap-south-1.amazonaws.com/facebook.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115559Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=b89a5b60cc97b47f38daf5d4650e7537da8044716112c82da473f5d9a3fb82ea" });
        }
      
        return {
          _id: startup._id,
          fund_ask: startup.colorCard.fund_ask || "",
          valuation: startup.colorCard.valuation || "",
          raised_funds: startup.colorCard.raised_funds || "",
          socialLinks, 
          company: startup.company || "",
          description: startup.description || "",
          sector: startup.sector || "",
          tagline: startup.tagline || "",
          stage: startup.stage || "",
          lastFunding: formatDate(startup.lastFunding) || "",
          location: startup.location || "",
          logo: startup.logo || "",
          TAM: startup.TAM || "",
          SAM: startup.SAM || "",
          SOM: startup.SOM || "",
          noOfEmployees: startup.noOfEmployees || 0,
          startedAtDate: formatDate(startup.startedAtDate) || "",
          keyFocus: startup.keyFocus ? startup.keyFocus.split(',') : [],
        };
      });
      

      return {
        status: true,
        message: "Startup data retrieved",
        data: curatedStartups,
      };

      // for investors
    } else if (type === "investor") {
      const query = {};
      if (sector) {
        query.sector = sector
      }
      if (city) {
        query.location = city;
      }
      if (investmentStage) {
        query.stage = investmentStage;
      }
      const investors = await InvestorModel.find(query);
      const users = await UserModel.find();
      const filteredUsers = users.filter((user) => {
        return investors.some((investor) => user?.investor?.toString() === investor._id.toString());
      });
      const founderIds = filteredUsers.map((investor) => investor._id);
      const founderQuery = {userStatus: "active"};
      if (gender) {
        founderQuery.gender = gender;
      }
      if (sectorPreference) {
        founderQuery.sectorPreferences = { $in: [sectorPreference] };
      }
      if (investmentSize) {
        founderQuery.investmentSize = investmentSize;
      }
      
      if (searchQuery) {
        founderQuery.firstName = { $regex: new RegExp(`^${searchQuery}`, 'i') };
      }
      const founders = await UserModel.find({
        _id: { $in: founderIds },
        ...founderQuery
      }).select("-password")
        .populate("investor");

        const curatedInvestors = founders.map((investor) => {
          const company = investor.investor;
          return {
            name: `${investor.firstName} ${investor.lastName}`,
            location: investor.location || "",
            designation: investor.designation || "",
            profilePicture: investor.profilePicture || "",
            bio: investor.bio || "",
            companyName: company?.companyName || "",
            companyLogo: company?.logo || "",
            linkedin: investor.linkedin || "", 
            startupsInvested: company?.startupsInvested || [],
            recentInvestment: "50 Lakhs",
            avgRecentInvestment: "5 Lakhs",
            avgAge:"2-5 years",
          };
        });
      
        return {
          status: true,
          message: "Investors data retrieved",
          data: curatedInvestors,
        };

      // for founder
    } else if (type === "founder") {
      const query = {};
      if (sector) {
        query.sector = sector
      }
      if (city) {
        query.location = city;
      }
      const startups = await StartUpModel.find(query);
      const founderIds = startups.map((startup) => startup.founderId);
      const founderQuery = {};
      if (gender) {
        founderQuery.gender = gender;
      }
      if (previousExits) {
        founderQuery.previousExits = previousExits;
      }
      if (yearsOfExperience) {
        founderQuery.yearsOfExperience = yearsOfExperience;
      }
      if (education) {
        founderQuery.education = education;
      }
      if (diversityMetrics) {
        founderQuery.diversityMetrics = { $in: [diversityMetrics] };
      }
      if (searchQuery) {
        founderQuery.firstName = { $regex: new RegExp(`^${searchQuery}`, 'i') };
      }
      const founders = await UserModel.find({
        _id: { $in: founderIds },
        ...founderQuery,
        userStatus: "active",
      }).select("-password")
        .populate("startUp");
        const curatedFounders = founders.map((founder) => {
          const startup = founder.startUp;
          
          // Extracting year from startedAtDate and month/year from lastFunding
          const startedYear = new Date(startup.startedAtDate).getFullYear();
          const lastFundingDate = new Date(startup.lastFunding);
          const lastFunding = `${lastFundingDate.toLocaleString('default', { month: 'long' })} ${lastFundingDate.getFullYear()}`;
      
          const socialLinks = [];
          if (startup.socialLinks.website) {
            socialLinks.push({ name: 'website', link: startup.socialLinks.website, logo:'https://thecapitalhub.s3.ap-south-1.amazonaws.com/website.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115647Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=8b949ec5ceae02ea43fd45636402114317d2458a34e4ed8cffac33cd6b680d42' });
          }
          if (startup.socialLinks.linkedin) {
            socialLinks.push({ name: 'linkedin', link: startup.socialLinks.linkedin, logo:"https://thecapitalhub.s3.ap-south-1.amazonaws.com/linkedin.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115636Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=ed531ad01ba21f7e5d16c0c96319b286f56874090761ecc55da72fce80cff419" });
          }
          if (startup.socialLinks.instagram) {
            socialLinks.push({ name: 'instagram', link: startup.socialLinks.instagram, logo:"https://thecapitalhub.s3.ap-south-1.amazonaws.com/instagram.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115632Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=7aa9660c6e510f92a28cbe6e02c69988eaac4855b232d0405ae94d1cbf5d7947" });
          }
          if (startup.socialLinks.twitter) {
            socialLinks.push({ name: 'twitter', link: startup.socialLinks.twitter, logo:"https://thecapitalhub.s3.ap-south-1.amazonaws.com/twitter.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115642Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=ca1832235485ed1cfd8816730c4e71d8c6bc7ed8310b119eb55b238a5d0278bf" });
          }
          if (startup.socialLinks.facebook) {
            socialLinks.push({ name: 'facebook', link: startup.socialLinks.facebook, logo:"https://thecapitalhub.s3.ap-south-1.amazonaws.com/facebook.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T115559Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=b89a5b60cc97b47f38daf5d4650e7537da8044716112c82da473f5d9a3fb82ea" });
          }
          if(startup.contactDetails?.email){
            socialLinks.push({name: 'email', link: startup.contactDetails?.email, logo:"https://thecapitalhub.s3.ap-south-1.amazonaws.com/email.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECwaCmFwLXNvdXRoLTEiRzBFAiAY6S1tly0Dsd6H67FBPm9COMQYkQ6UixwBnY6NxRQ6RgIhAJIsTgtddJ%2FNskJNKZqlPG5ifmeqwIU4c9avLOsmy8DGKuQCCHUQABoMNTMzMjY3MjM4NjU0Igzm4PsMtlKevCpGP6YqwQJvS8SstX3eBJ7ev0ehu1lxFlR0FqhyDBie3yHH%2Fyvkqiq0mJHjr2n3je9t6JTvjq8vbUkgF2%2BoeBFM1Sps0VjlL256WR2zzQUrNqlhSnYeXmPIqst%2Bj8UWmE8YSwNkMiBx7mYKBkZl0sFAnkQbmt77Hh%2F%2B8e5uktJtL%2BJ9QVqb6x06hbr1jKjlIJviARYfk5NXVs0etKDpFA9l9lgPI0gqW34rlXAPIMf%2Fj6Z7Pa5Vs%2Bybovj8KfKtKNM9%2BHtwtNpdhHbE3Htei%2B3qs7xVIfEW4cq1EooWBSn6oPgOHSvCoj90%2BrE%2F90SnSJQyIkN4iOBkFjI7aCu9WGax9Dl4aiHxnzRpA1Oei8VqTbSgx8M3LaElpK8hKUdAI6FYp95GYGUNo29lALtrZVp52o4eOUVwreRti4oEykdwbD883WPwx5EwhvDptwY6swIHX7vOD4sTYbuwcw08%2FIxZmgxwsuX8QHgEwP53uVsd%2Bvhli1wBhL8AqT%2BKC4ybRj9tH79KR4vv7OpvczJCBTnNWTQ%2F2GZpZirJqoUvj4eEWBFbBMzYVDsARz3uA1%2FH5PcUgp2G5VCUEdjUGEAhcpCZ3Z1PE8wZz3uyjmH8zgWIR3kGl5TFqKsiz3PMWWZ2Tr2AMjzdTkOu3onHrhP9bB0CGoaul6r7Ai0YL%2Blgmr4oc188dZLurx1%2FenbnvfZrPuVwj%2FbEyaxC6bH%2BOVolzHxuYWYbgXFskok%2FKeVIye1I8hdJ2rVcCe69F3veGWN%2BTwWy4H5bmivxwrLOlMxZTqETd%2FqaRt%2F2p%2FHcfwBe3TgJZNOUdqfN2bKkIKi8YfmMHyjtMvtnj9rPiXyw5htX%2BZP6rp9w&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240930T120737Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIAXYKJUJ37CYMYBFJU%2F20240930%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=97e301af94cd55c71a7cdccb0ac0a4406acffd90a98b04426bb904989a3ca465"})
          }
      
          return {
            name: `${founder.firstName} ${founder.lastName}`,
            profilePicture: founder.profilePicture || "",
            designation: founder.designation || "",
            company: startup.company || "",
            location: startup.location || "",
            startedAtDate: startedYear,
            lastFunding,
            bio: founder.bio || "",
            education: founder.education || "",
            experience: founder.experience || "",
            companyStage: startup.companyStage || "",
            companySector: startup.sector || "",
            description: startup.description || "",
            socialLinks,
            companyLogo: startup.logo || "",
          };
        });
      
        return {
          status: true,
          message: "Founder data retrieved",
          data: curatedFounders,
        };
    } else {
      return {
        status: false,
        message: "Invalid 'type' parameter",
      };
    }
  } catch (error) {
    console.error("Error getting explore results:", error);
    return {
      status: false,
      message: "An error occurred while getting explore results.",
    };
  }
};

export const getExploreFilters = async (type) => {
  try {
    if (type === "startup") {
      // const startupSectors = await StartUpModel.distinct("sector");
      const startupCities = await StartUpModel.distinct("location");
      return {
        message: "Startup filters retrieved",
        data: {
          // sectors: startupSectors,
          cities: startupCities,
        },
      };
    } else if (type === "investor") {
      // const investorSectors = await InvestorModel.distinct("sector");
      const investorCities = await InvestorModel.distinct("location");
      return {
        message: "Investor filters retrieved",
        data: {
          // sectors: investorSectors,
          cities: investorCities,
        },
      };
    } else if (type === "founder") {
      // const founderSectors = await StartUpModel.distinct("sector");
      const founderCities = await StartUpModel.distinct("location");
      return {
        message: "Founder filters retrieved",
        data: {
          // sectors: founderSectors,
          cities: founderCities,
        },
      };
    } else {
      return {
        message: "Invalid 'type' parameter",
      };
    }
  } catch (error) {
    console.error("Error getting explore filters:", error);
    return {
      message: "An error occurred while getting explore filters.",
    };
  }
};

export const validateSecretKey = async ({ oneLinkId, secretOneLinkKey }) => {
  try {
    const user = await UserModel.findOne({ oneLinkId });

    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }

    if (!user.secretKey) {
      const token = jwt.sign({}, secretKey, { expiresIn: "1h" });
      return {
        status: 200,
        message: "Secret key is valid",
        token,
      };
    }

    if (secretOneLinkKey === user.secretKey) {
      const token = jwt.sign({}, secretKey, { expiresIn: "1h" });
      return {
        status: 200,
        message: "Secret key is valid",
        token,
      };
    } else {
      return {
        status: 401,
        message: "Invalid secret key",
      };
    }
  } catch (error) {
    console.error("Error validating secret key:", error);
    return {
      status: 500,
      message: "An error occurred while validating the secret key.",
    };
  }
};

export const createSecretKey = async (userId, secretOneLinkKey) => {
  try {
    // const hashedSecretKey = await hashPassword(secretOneLinkKey);
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { secretKey: secretOneLinkKey },
      { new: true }
    );
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    return {
      status: 200,
      message: "Secret key created and stored successfully",
      user: user,
    };
  } catch (error) {
    console.error("Error creating and storing secret key:", error);
    return {
      status: 500,
      message: "An error occurred while creating and storing the secret key.",
    };
  }
};

export const googleLogin = async (credential) => {
  try {
    const { email } = jwt.decode(credential);
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return {
        status: 404,
        message: "User not found.",
      }
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      secretKey
    );
    user.password = undefined;
    return {
      status: 200,
      message: "Google Login successfull",
      data: user,
      token: token,
    };
  } catch (error) {
    console.error("Error login:", error);
    return {
      status: 500,
      message: "An error occurred while login using google.",
    };
  }
};

// Update Education
export const updateEducation = async (userId, educationId, updatedData) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    const education = user.recentEducation.id(educationId);
    if (!education) {
      return {
        status: 404,
        message: "Education entry not found",
      };
    }
    if (updatedData?.logo) {
      const { secure_url } = await cloudinary.uploader.upload(updatedData.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
        format: "webp",
        unique_filename: true,
      });
      updatedData.logo = secure_url;
    }

    education.set(updatedData);
    await user.save();

    return {
      status: 200,
      message: "Education updated",
      data: user.recentEducation,
    };
  } catch (error) {
    console.error("Error updating education:", error);
    return {
      status: 500,
      message: "An error occurred while updating education.",
    };
  }
};

// Delete Education
export const deleteEducation = async (userId, educationId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    user.recentEducation = user.recentEducation.filter(
      (education) => education._id.toString() !== educationId
    );
    await user.save();
    return {
      status: 200,
      message: "Education deleted",
      data: user.recentEducation,
    };
  } catch (error) {
    console.error("Error deleting education:", error);
    return {
      status: 500,
      message: "An error occurred while deleting education.",
    };
  }
};

// Update Experience
export const updateExperience = async (userId, experienceId, updatedData) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    const experience = user.recentExperience.id(experienceId);
    if (!experience) {
      return {
        status: 404,
        message: "Experience entry not found",
      };
    }
    if (updatedData?.logo) {
      const { secure_url } = await cloudinary.uploader.upload(updatedData.logo, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
        format: "webp",
        unique_filename: true,
      });
      updatedData.logo = secure_url;
    }

    experience.set(updatedData);
    await user.save();

    return {
      status: 200,
      message: "Experience updated",
      data: user.recentExperience,
    };
  } catch (error) {
    console.error("Error updating experience:", error);
    return {
      status: 500,
      message: "An error occurred while updating experience.",
    };
  }
};

export const deleteExperience = async (userId, experienceId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: 404,
        message: "User not found",
      };
    }
    user.recentExperience = user.recentExperience.filter(
      (experience) => experience._id.toString() !== experienceId
    );
    await user.save();
    return {
      status: 200,
      message: "Experience deleted",
      data: user.recentExperience,
    };
  } catch (error) {
    console.error("Error deleting experience:", error);
    return {
      status: 500,
      message: "An error occurred while deleting experience.",
    };
  }
};
