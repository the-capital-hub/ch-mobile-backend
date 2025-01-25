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
import { VCModel } from "../models/VC.js"
import { getUserPost } from "../controllers/postController.js";
import { userPost } from "./postService.js";
import { getDocumentByUser } from '../services/documentDataService.js';

const adminMail = "learn.capitalhub@gmail.com";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = { year: 'numeric', month: 'long' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const userRequiredFields = [
  "bio", "designation", "education", "experience", "startUp"
];

const companyRequiredFields = [
  "SOM", "TAM", "colorCard", "company", "description", "fundingsAsk",
  "lastFunding", "location", "mission", "noOfEmployees", "productStage",
  "sector", "socialLinks", "stage", "startedAtDate", "tagline", "team", "vision"
];

const calculateProfileCompletion = (user, requiredFields) => {
  if (!user || !requiredFields) return 0;
  const filledFields = requiredFields.filter(
    (field) => user[field] && user[field].length !== 0
  );
  return (filledFields.length / requiredFields.length) * 100;
};

const base64ToBuffer = (base64String) => {  
  const buffer = Buffer.from(base64String, 'base64');
  return buffer
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
        status: false,
        message: "No user exists",
      };
    }

    console.log(`Searching for user with username: ${username}`);
    const response = await UserModel.findOne({ userName: username });

    if (!response) {
      console.log(`No user found with username: ${username}`);
      return {
        status: false,
        message: "No user exists",
      };
    }

    console.log(`User found: ${response}`);
    return {
      status: true,
      message: response,
    };
  } catch (error) {
    console.error("An error occurred while finding the user", error);
    return {
      status: false,
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
    let user = await UserModel.findOne({ oneLinkId: userId }).populate('startUp investor connections');
    if (!user) {
      user = await UserModel.findById(userId).populate(['startUp', 'investor', 'connections']);
    }
    if (!user) {
      return {
        status: false,
        message: "User not found.",
      };
    }
    user.password = undefined;

    // Calculate document completion
    let documentsCount = 0;
      try {
        const pdfDataLegal = await getDocumentByUser(userId, "legal and compliance");
        const pdfDataKyc = await getDocumentByUser(userId, "kycdetails");
        const pdfDataBusiness = await getDocumentByUser(userId, "business");
        const pdfDataPitch = await getDocumentByUser(userId, "pitchdeck");
        
        documentsCount = 
          (pdfDataLegal?.data?.length || 0) + 
          (pdfDataKyc?.data?.length || 0) + 
          (pdfDataBusiness?.data?.length || 0) + 
          (pdfDataPitch?.data?.length || 0);

      } catch (error) {
        console.error("Error fetching PDF data:", error);
        documentsCount = 0;
      }


    // Get posts count
    let postsCount = 0;
    try {
      const posts = await userPost(userId);
      postsCount = posts.allPosts.length;
    } catch (error) {
      console.error("Error fetching posts:", error);
    }

    // Calculate all milestones
    const milestone_profile = {
      name: "Profile",
      completion: Math.round(calculateProfileCompletion(user, userRequiredFields)),
      description: "Your Profile is successfully created, please complete the remaining profile",
      image: "https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/image+79.png"
    };

    const milestone_company = {
      name: "Company",
      completion: Math.round(calculateProfileCompletion(user.startUp, companyRequiredFields)),
      description: "Company Profile is successfully created, please complete the remaining details",
      image: "https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/image 79-1.png"
    };

    const milestone_onelink = {
      name: "OneLink",
      completion: user.startUp?.introductoryMessage || user.investor?.introductoryMessage ? 100 : 0,
      description: "Fill all details to complete Onelink profile.",
      image: "https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/image 79-3.png"
    };

    const milestone_documents = {
      name: "Documents",
      completion: Math.round(documentsCount <= 4 ? (documentsCount / 4) * 100 : 100),
      description: "Upload your business related documents to get your Onelink profile ready to share",
      image: "https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/image 79-2.png"
    };

    const milestone_posts = {
      name: "Posts",
      completion: postsCount > 0 ? 100 : 0,
      description: "Hola! Create your first post to share your experience with Capital Hub.",
      image: "https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/image 79-1.png"
    };

    const userProfile = {
      profilePicture: user.profilePicture || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      userName: user.userName || "",
      designation: user.designation || "",
      companyName: user.startUp?.company || user.investor?.companyName || "",
      location: user.startUp?.location || user.investor?.location || "",
      bio: user.bio || "",
      education: user.education || "",
      experience: user.experience || "",
      connectionsCount: user.connections?.length || 0,
      followersCount: user.connectionsReceived?.length || 0,
      isSubscribed: user.isSubscribed || false,
      recentConnections: user.connections?.length 
        ? user.connections
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 4)
            .map(connection => ({
              firstName: connection.firstName || "",
              lastName: connection.lastName || "",
              profilePicture: connection.profilePicture || "",
              designation: connection.designation || ""
            }))
        : [],
      milestone_profile,
      milestone_company,
      milestone_onelink,
      milestone_documents,
      milestone_posts,
      companyData: {
        companyName: "",
        location: "",
        logo: "",
        description: "",
        sector: "",
        industry: "",
        startedAtDate: "",
        socialLinks: [],
        stage: "",
        age: "",
        lastFunding: ""
      }
    };

    // Add profile specific fields based on user type
    if (user.startUp) {
      const socialLinks = [];
      if (user.startUp.socialLinks.website) {
        socialLinks.push({ name: 'website', link: user.startUp.socialLinks.website, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/website.png' });
      }
      if (user.startUp.socialLinks.linkedin) {
        socialLinks.push({ name: 'linkedin', link: user.startUp.socialLinks.linkedin, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/linkedin.png' });
      }
      if (user.startUp.socialLinks.instagram) {
        socialLinks.push({ name: 'instagram', link: user.startUp.socialLinks.instagram, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/instagram.png' });
      }
      if (user.startUp.socialLinks.twitter) {
        socialLinks.push({ name: 'twitter', link: user.startUp.socialLinks.twitter, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/twitter.png' });
      }
      if (user.startUp.socialLinks.facebook) {
        socialLinks.push({ name: 'facebook', link: user.startUp.socialLinks.facebook, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/facebook.png' });
      }
      if (user.startUp.contactDetails?.email) {
        socialLinks.push({ name: 'email', link: user.startUp.contactDetails.email, logo: "https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/email.png" });
      }

      userProfile.companyData = {
        companyName: user.startUp.company || "",
        location: user.startUp.location || "",
        logo: user.startUp.logo || "",
        description: user.startUp.description || "",
        sector: user.startUp.sector || "",
        industry: user.startUp.industryType || "",
        startedAtDate: formatDate(user.startUp.startedAtDate) || "",
        socialLinks, 
        stage: user.startUp.stage || "",
        age: formatDate(user.startUp.age) || "",
        lastFunding: formatDate(user.startUp.lastFunding) || ""
      };
    } else if (user.investor) {
      const socialLinks = [];
      if (user.investor.socialLinks.website) {
        socialLinks.push({ name: 'website', link: user.investor.socialLinks.website, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/website.png' });
      }
      if (user.investor.socialLinks.linkedin) {
        socialLinks.push({ name: 'linkedin', link: user.investor.socialLinks.linkedin, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/linkedin.png' });
      }
      if (user.investor.socialLinks.instagram) {
        socialLinks.push({ name: 'instagram', link: user.investor.socialLinks.instagram, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/instagram.png' });
      }
      if (user.investor.socialLinks.twitter) {
        socialLinks.push({ name: 'twitter', link: user.investor.socialLinks.twitter, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/twitter.png' });
      }
      if (user.investor.socialLinks.facebook) {
        socialLinks.push({ name: 'facebook', link: user.investor.socialLinks.facebook, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/facebook.png' });
      }
      if (user.investor.contactDetails?.email) {
        socialLinks.push({ name: 'email', link: user.investor.contactDetails.email, logo: "https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/email.png" });
      }

      userProfile.companyData = {
        companyName: user.investor.companyName || "",
        location: user.investor.location || "",
        logo: user.investor.logo || "",
        description: user.investor.description || "",
        sector: user.investor.sector || "",
        industry: user.investor.industry || "",
        startedAtDate: formatDate(user.investor.startedAtDate) || "",
        socialLinks,
        stage: user.investor.stage || "",
        age: formatDate(user.investor.age) || ""
      };
    }

    return userProfile;
  } catch (error) {
    console.error("Error getting user:", error);
    return {
      status: false,
      message: "An error occurred while getting the user.",
    };
  }
};

//getProfilePageData
export const getFounderProfilePageData = async (userId, founderId) => {
  try {
    const user = await UserModel.findById(founderId).populate('startUp investor');
    const currentUser = await UserModel.findById(userId);

    let companyData = {};
    let userEmail = {};
    // Curate user profile response
    const userProfile = {
      profilePicture: user.profilePicture || "",
      linkedinUrl: user.linkedin || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      designation: user.designation || "",
      companyName: user.startUp?.company || user.investor?.companyName || "",
      location: user.startUp?.location || user.investor?.location || "",
      bio: user.bio || "",
      education: user.recentEducation.map(edu => ({
        educationLogo: edu.logo || "https://res.cloudinary.com/drjt9guif/image/upload/v1737795495/undefined/startUps/logos/vnzjvdh52sd16mo6rge7.webp",
        educationSchool: edu.schoolName || "",
        educationLocation: edu.location || "",
        educationCourse: edu.course || "",
        educationPassoutDate: edu.passoutYear ? new Date(edu.passoutYear).getFullYear() : "",
        educationDescription: edu.description || "",
      })) || [],
      experience: user.recentExperience.map(exp => ({
        companyLogo: exp.logo || "https://res.cloudinary.com/drjt9guif/image/upload/v1737795495/undefined/startUps/logos/tjuzpjghxiyarfwihzkh.webp",
        companyName: exp.companyName || "",
        companyLocation: exp.location || "",
        companyRole: exp.role || "",
        companyDescription: exp.description || "",
        companyStartDate: exp.experienceDuration.startYear ? new Date(exp.experienceDuration.startYear).getFullYear() : "",
        companyEndDate: exp.experienceDuration.endYear ? new Date(exp.experienceDuration.endYear).getFullYear() : "",
      })) || [],
      isSubscribed: user.isSubscribed || false
    };


    if (user.startUp) {
      const socialLinks = [];
      if (user.startUp.socialLinks.website) {
        socialLinks.push({ name: 'website', link: user.startUp.socialLinks.website, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/website.png' });
      }
      if (user.startUp.socialLinks.linkedin) {
        socialLinks.push({ name: 'linkedin', link: user.startUp.socialLinks.linkedin, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/linkedin.png' });
      }
      if (user.startUp.socialLinks.instagram) {
        socialLinks.push({ name: 'instagram', link: user.startUp.socialLinks.instagram, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/instagram.png' });
      }
      if (user.startUp.socialLinks.twitter) {
        socialLinks.push({ name: 'twitter', link: user.startUp.socialLinks.twitter, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/twitter.png' });
      }
      if (user.startUp.socialLinks.facebook) {
        socialLinks.push({ name: 'facebook', link: user.startUp.socialLinks.facebook, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/facebook.png' });
      }
      if (user.startUp.contactDetails?.email) {
        socialLinks.push({ name: 'email', link: user.startUp.contactDetails.email, logo: "https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/email.png" });
      }

      companyData = {
        companyName: user.startUp.company || "",
        location: user.startUp.location || "",
        logo: user.startUp.logo || "",
        description: user.startUp.description || "",
        sector: user.startUp.sector || "",
        startedAtDate: formatDate(user.startUp.startedAtDate) || "",
        socialLinks, 
        stage: user.startUp.stage || "",
        age: formatDate(user.startUp.age) || "",
        lastFunding: formatDate(user.startUp.lastFunding) || ""
      };
    } else if (user.investor) {
      const socialLinks = [];
      if (user.investor.socialLinks.website) {
        socialLinks.push({ name: 'website', link: user.investor.socialLinks.website, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/website.png' });
      }
      if (user.investor.socialLinks.linkedin) {
        socialLinks.push({ name: 'linkedin', link: user.investor.socialLinks.linkedin, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/linkedin.png' });
      }
      if (user.investor.socialLinks.instagram) {
        socialLinks.push({ name: 'instagram', link: user.investor.socialLinks.instagram, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/instagram.png' });
      }
      if (user.investor.socialLinks.twitter) {
        socialLinks.push({ name: 'twitter', link: user.investor.socialLinks.twitter, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/twitter.png' });
      }
      if (user.investor.socialLinks.facebook) {
        socialLinks.push({ name: 'facebook', link: user.investor.socialLinks.facebook, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/facebook.png' });
      }
      if (user.investor.contactDetails?.email) {
        socialLinks.push({ name: 'email', link: user.investor.contactDetails.email, logo: "https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/email.png" });
      }

      companyData = {
        companyName: user.investor.companyName || "",
        location: user.investor.location || "",
        logo: user.investor.logo || "",
        description: user.investor.description || "",
        sector: user.investor.sector || "",
        startedAtDate: formatDate(user.investor.startedAtDate) || "",
        socialLinks,
        stage: user.investor.stage || "",
        age: formatDate(user.investor.age) || ""
      };
    }

    // display email if current user has access to founder's email
    if(currentUser.investorIdCount.includes(founderId) || currentUser.isSubscribed){
      userEmail = {
        email: user.email,
        isAccessible: true,
      };
    }
    else{
      userEmail = {
        email: "",
        isAccessible: false,
      };
    }

    return {
      userProfile,
      companyData,
      userEmail,
    };
  } catch (error) {
    console.error("Error getting profile page data:", error);
    return {
      status: false,
      message: "An error occurred while getting the profile page data.",
    };
  }
}

//add founders email to current user
export const addFounderEmailToCurrentUser = async (userId, founderId) => {
  try {
    const founder = await UserModel.findById(founderId);
    const currentUser = await UserModel.findById(userId);

    // Check if the founder's email is already accessible
    if (currentUser.investorIdCount.includes(founderId)) {
      const userEmail = {
        email: founder.email,
        isAccessible: true,
      };
      return {
        status: true,
        message: "Current user already has access to founder's email",
        data: userEmail,
      };
    }

    // Check if the user is subscribed
    if (currentUser.isSubscribed) {
      const userEmail = {
        email: founder.email,
        isAccessible: true,
      };
      currentUser.investorIdCount.push(founderId);
      await currentUser.save();
      return {
        status: true,
        message: "Founder email added to current user",
        data: userEmail,
      };
    }

    // Check if the user has reached the maximum limit of 5 emails
    if (currentUser.investorIdCount.length >= 5 && !currentUser.isSubscribed) {
      return {
        status: false,
        message: "Current user has reached the maximum number of email access. Please subscribe to access more Founders/Investors' emails.",
      };
    }

    // If not subscribed and under limit, add the email
    currentUser.investorIdCount.push(founderId);
    await currentUser.save();
    const userEmail = {
      email: founder.email,
      isAccessible: true,
    };
    return {
      status: true,
      message: "Founder email added to current user",
      data: userEmail,
    };

  } catch (error) {
    console.error("Error viewing founder email:", error);
    return {
      status: false,
      message: "An error occurred while viewing the founder email.",
    };
  }
};

// Update User
export const updateUserData = async ({ userId, newData }) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return { status: false, message: "User not found", data: {} };
    }

    // Handle profile picture upload
    if (newData.profilePicture) {
      const imageBuffer = base64ToBuffer(newData.profilePicture);
      const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`; 
      const { secure_url } = await cloudinary.uploader.upload(imageBase64, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/users/profile`,
        format: "webp",
        unique_filename: true,
        resource_type: "auto"
      });
      newData.profilePicture = secure_url;
    }

    // Basic user info update
    const basicFields = ['firstName', 'lastName', 'userName'];
    basicFields.forEach(field => {
      if (newData[field]) user[field] = newData[field];
    });

    // Handle multiple experience updates
    if (newData.experiences && Array.isArray(newData.experiences)) {
      const experiencePromises = newData.experiences.map(async (exp) => {
        // Handle company logo upload
        let companyLogo = null;
        if (exp.companyLogo) {
          const imageBuffer = base64ToBuffer(exp.companyLogo);
          const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`; 
          const { secure_url } = await cloudinary.uploader.upload(imageBase64, {
            folder: `${process.env.CLOUDIANRY_FOLDER}/startUps/logos`,
            format: "webp",
            unique_filename: true,
            resource_type: "auto"
          });
          companyLogo = secure_url;
        }

        return {
          companyName: exp.companyName,
          location: exp.companyLocation,
          role: exp.companyRole,
          description: exp.companyDescription,
          logo: companyLogo,
          experienceDuration: {
            startYear: exp.companyStartDate,
            endYear: exp.companyEndDate,
          },
        };
      });

      const experiences = await Promise.all(experiencePromises);
      user.recentExperience = experiences;
    }

    // Handle multiple education updates
    if (newData.educations && Array.isArray(newData.educations)) {
      const educationPromises = newData.educations.map(async (edu) => {
        // Handle education logo upload
        let educationLogo = null;
        if (edu.educationLogo) {
          const imageBuffer = base64ToBuffer(edu.educationLogo);
          const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`; 
          const { secure_url } = await cloudinary.uploader.upload(imageBase64, {
            folder: `${process.env.CLOUDIANRY_FOLDER}/education/logos`,
            format: "webp",
            unique_filename: true,
            resource_type: "auto"
          });
          educationLogo = secure_url;
        }

        return {
          schoolName: edu.educationSchool,
          location: edu.educationLocation,
          course: edu.educationCource,
          passoutYear: edu.educationPassoutDate,
          description: edu.educationDescription,
          logo: educationLogo,
        };
      });

      const educations = await Promise.all(educationPromises);
      user.recentEducation = educations;
    }

    await user.save();
    return { status: true, message: "User updated successfully", data: user };
  } catch (error) {
    console.error("Error updating user:", error);
    return { status: false, message: error.message, data: {} };
  }
};

// Toggle block/unblock user
export const toggleUserBlockStatus = async (userId, targetUserId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }

    // Check if the user is trying to block themselves
    if (userId === targetUserId) {
      return {
        status: false,
        message: "Cannot block/unblock yourself",
      };
    }

    // Check if the target user is already blocked
    const isBlocked = user.blockedUsers.includes(targetUserId);
    
    if (isBlocked) {
      // Unblock the user
      await UserModel.findByIdAndUpdate(
        userId,
        { $pull: { blockedUsers: targetUserId } },
        { new: true }
      );
      return {
        status: true,
        message: "User unblocked successfully",
      };
    } else {
      // Block the user
      user.blockedUsers.push(targetUserId);
      await user.save();
      return {
        status: true,
        message: "User blocked successfully",
      };
    }
  } catch (error) {
    console.error("Error toggling user block status:", error);
    return {
      status: false,
      message: "An error occurred while toggling the user block status.",
    };
  }
};

//get User by id with request body
export const getUserByIdBody = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    return {
      status: true,
      message: "User details retrieved successfully.",
      data: user,
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return {
      status: false,
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
        status: false,
        message: "StartUp not found.",
      };
    }
    return {
      status: true,
      message: "StartUp details retrieved successfully.",
      data: startUp,
    };
  } catch (error) {
    console.error("Error getting StartUp:", error);
    return {
      status: false,
      message: "An error occurred while getting the StartUp.",
    };
  }
};

export const updateUserById = async (userId, newData) => {
  try {
    const data = await UserModel.findByIdAndUpdate(userId, { ...newData }, { new: true });
    return {
      status: true,
      message: "User updated succesfully",
      data,
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
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
        status: false,
        message: "Invalid Password",
      };
    }
    user.password = await hashPassword(newPassword);
    await user.save();
    return {
      status: true,
      message: "Password Changed Successfully",
    };
  } catch (error) {
    return {
      status: false,
      message: "An error occurred while updating the password.",
    };
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return {
        status: false,
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
    if (response.status === true) {
      return {
        status: true,
        message: "Password reset email sent successfully",
      };
    } else {
      return {
        status: false,
        message: "Error sending password reset email",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      status: false,
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
        status: false,
        message: "Invalid or expired reset token",
      };
    }
    const user = await UserModel.findById(decodedToken.userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    user.password = newPassword;
    await user.save();
    return {
      status: true,
      message: "Password reset successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      status: false,
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
      status: true,
      data: {
        users: users,
        company: company.concat(investor),
      },
    };
  } catch (error) {
    console.error("Error searching for users:", error);
    return {
      status: false,
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
        status: false,
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
      status: true,
      message: "Education added",
      data: user,
    };
  } catch (error) {
    console.error("Error adding recent education:", error);
    return {
      status: false,
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
        status: false,
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
      status: true,
      message: "Experience added",
      data: user,
    };
  } catch (error) {
    console.error("Error adding recent experience:", error);
    return {
      status: false,
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
        status: false,
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
      status: true,
      message: "Startup added to user successfully.",
      data: user,
      isFirst,
    };
  } catch (error) {
    console.error("Error adding startups to user:", error);
    return {
      status: false,
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
        status: false,
        message: "User not found.",
      };
    }
    return {
      status: true,
      message: "Investor added to user successfully.",
      data: user,
    };
  } catch (error) {
    console.error("Error adding user as investor:", error);
    return {
      status: false,
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
      sector_focus,
      stage_focus,
      ticket_size
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
          socialLinks.push({ name: 'website', link: startup.socialLinks.website, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/website.png' });
      }
      if (startup.socialLinks.linkedin) {
          socialLinks.push({ name: 'linkedin', link: startup.socialLinks.linkedin, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/linkedin.png' });
      }
      if (startup.socialLinks.instagram) {
          socialLinks.push({ name: 'instagram', link: startup.socialLinks.instagram, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/instagram.png' });
      }
      if (startup.socialLinks.twitter) {
          socialLinks.push({ name: 'twitter', link: startup.socialLinks.twitter, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/twitter.png' });
      }
      if (startup.socialLinks.facebook) {
          socialLinks.push({ name: 'facebook', link: startup.socialLinks.facebook, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/facebook.png' });
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
            socialLinks.push({ name: 'website', link: startup.socialLinks.website, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/website.png' });
        }
        if (startup.socialLinks.linkedin) {
            socialLinks.push({ name: 'linkedin', link: startup.socialLinks.linkedin, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/linkedin.png' });
        }
        if (startup.socialLinks.instagram) {
            socialLinks.push({ name: 'instagram', link: startup.socialLinks.instagram, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/instagram.png' });
        }
        if (startup.socialLinks.twitter) {
            socialLinks.push({ name: 'twitter', link: startup.socialLinks.twitter, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/twitter.png' });
        }
        if (startup.socialLinks.facebook) {
            socialLinks.push({ name: 'facebook', link: startup.socialLinks.facebook, logo: 'https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/facebook.png' });
        }        
          if(startup.contactDetails?.email){
            socialLinks.push({name: 'email', link: startup.contactDetails?.email, logo:"https://ch-social-link-logo.s3.ap-south-1.amazonaws.com/email.png"})
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

          // for VC
    } else if (type === "vc") {
      const query = {};
      if (sector_focus) {
        query.sector_focus = sector_focus;
      }
      if (stage_focus) {
        query.stage_focus = stage_focus;
      }
      if (ticket_size) {
        query.ticket_size = { $gte: size };
      }
      
      if (searchQuery) {
        query.name = { $regex: new RegExp(`^${searchQuery}`, 'i') };
      }
      const VCs = await VCModel.find(query);
      const curatedVCs = VCs.map(vc => ({
        _id: vc._id,
        logo: vc.logo || " " ,
        name: vc.name,
        location: vc.location,
        stage_focus: vc.stage_focus,
        sector_focus: vc.sector_focus,
        ticket_size: vc.ticket_size || "",
        age: vc.age,
      }));
      return {
        status: true,
        message: "VC data retrieved",
        data: curatedVCs,
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
    }
    else if (type === "vc") {
      // const founderSectors = await StartUpModel.distinct("sector");
      const founderCities = await StartUpModel.distinct("location");
      return {
        status: true,
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
        status: false,
        message: "User not found",
      };
    }

    if (!user.secretKey) {
      const token = jwt.sign({}, secretKey, { expiresIn: "1h" });
      return {
        status: true,
        message: "Secret key is valid",
        token,
      };
    }

    if (secretOneLinkKey === user.secretKey) {
      const token = jwt.sign({}, secretKey, { expiresIn: "1h" });
      return {
        status: true,
        message: "Secret key is valid",
        token,
      };
    } else {
      return {
        status: false,
        message: "Invalid secret key",
      };
    }
  } catch (error) {
    console.error("Error validating secret key:", error);
    return {
      status: false,
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
        status: false,
        message: "User not found",
      };
    }
    return {
      status: true,
      message: "Secret key created and stored successfully",
      data: user.secretKey
    };
  } catch (error) {
    console.error("Error creating and storing secret key:", error);
    return {
      status: false,
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
        status: false,
        message: "User not found.",
      }
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      secretKey
    );
    user.password = undefined;
    return {
      status: true,
      message: "Google Login successfull",
      data: user,
      token: token,
    };
  } catch (error) {
    console.error("Error login:", error);
    return {
      status: false,
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
        status: false,
        message: "User not found",
      };
    }
    const education = user.recentEducation.id(educationId);
    if (!education) {
      return {
        status: false,
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
      status: true,
      message: "Education updated",
      data: user.recentEducation,
    };
  } catch (error) {
    console.error("Error updating education:", error);
    return {
      status: false,
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
        status: false,
        message: "User not found",
      };
    }
    user.recentEducation = user.recentEducation.filter(
      (education) => education._id.toString() !== educationId
    );
    await user.save();
    return {
      status: true,
      message: "Education deleted",
      data: user.recentEducation,
    };
  } catch (error) {
    console.error("Error deleting education:", error);
    return {
      status: false,
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
        status: false,
        message: "User not found",
      };
    }
    const experience = user.recentExperience.id(experienceId);
    if (!experience) {
      return {
        status: false,
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
      status: true,
      message: "Experience updated",
      data: user.recentExperience,
    };
  } catch (error) {
    console.error("Error updating experience:", error);
    return {
      status: false,
      message: "An error occurred while updating experience.",
    };
  }
};

export const deleteExperience = async (userId, experienceId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    user.recentExperience = user.recentExperience.filter(
      (experience) => experience._id.toString() !== experienceId
    );
    await user.save();
    return {
      status: true,
      message: "Experience deleted",
      data: user.recentExperience,
    };
  } catch (error) {
    console.error("Error deleting experience:", error);
    return {
      status: false,
      message: "An error occurred while deleting experience.",
    };
  }
};

const formatRelativeTime = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMillis = now - past;
  const diffInDays = Math.floor(diffInMillis / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInDays < 0) {
    return "just now";
  } else if (diffInDays < 1) {
    return "today";
  } else if (diffInDays === 1) {
    return "1 day ago";
  } else if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  } else if (diffInMonths === 1) {
    return "1 month ago";
  } else if (diffInMonths < 12) {
    return `${diffInMonths} months ago`;
  } else if (diffInYears === 1) {
    return "1 year ago";
  } else {
    return `${diffInYears} years ago`;
  }
};

export const getProfilePosts = async (userId, type) => {
  try {
    const user = await UserModel.findById(userId).populate('featuredPosts savedPosts companyUpdate startUp investor');
    const post = await userPost(userId);
    
    const curatePost = (posts) => {
      return posts.map(post => {
        // Merge image and images array
        let images = [];
        if (post.image) {
          images.push(post.image);
        }
        if (post.images && Array.isArray(post.images)) {
          images = [...images, ...post.images];
        }

        // Calculate total votes and format poll options
        const totalVotes = post.pollOptions?.reduce((sum, option) => sum + option.votes.length, 0) || 0;

        // Curate poll options
        const curatedPollOptions = post.pollOptions?.map(option => ({
          _id: option._id,
          option: option.option,
          numberOfVotes: option.votes.length,
          hasVoted: option.votes.includes(userId)
        }));

        // Get array of optionIds voted by current user
        const myVotes = post.pollOptions
          ?.filter(option => option.votes.includes(userId))
          .map(option => option._id) || [];

        return {
          userProfilePicture: user.profilePicture,
          userDesignation: user.designation,
          userFirstName: user.firstName,
          userLastName: user.lastName,
          userLocation: user.startUp ? user.startUp.location : user.investor ? user.investor.location : "",
          postId: post._id,
          description: post.description || "",
          images: images,
          age: formatRelativeTime(post.createdAt),
          // Add poll-related fields
          pollOptions: curatedPollOptions,
          myVotes,
          totalVotes
        };
      });
    };

    if (type === 'featured') {
      return curatePost(user.featuredPosts || []);
    }
    else if (type === 'mypost') {
      return curatePost(post.allPosts || []);
    }
    else if (type === 'company') {
      return curatePost(user.companyUpdate || []);
    }
    else {
      return [];
    }
  } catch (error) {
    console.error("Error getting profile posts:", error);
    return [];
  }
};