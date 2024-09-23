import jwt from "jsonwebtoken";
import {
  registerUserService,
  getUsersService,
  getUserByUserName,
  loginUserService,
  getUserById,
  updateUserData,
  updateUserById,
  changePassword,
  requestPasswordReset,
  resetPassword,
  searchUsers,
  addEducation,
  addExperience,
  addStartupToUser,
  addUserAsInvestor,
  getExplore,
  getExploreFilters,
  validateSecretKey,
  createSecretKey,
  googleLogin,
  updateEducation,
  updateExperience,
  deleteEducation,
  deleteExperience,
  blockUser,
  getUserByIdBody,
  unblockUser,
} from "../services/userService.js";

import { sendMail } from "../utils/mailHelper.js";
import { secretKey } from "../constants/config.js";
import { UserModel } from "../models/User.js";
import { StartUpModel } from "../models/startUp.js";
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import axios from "axios";
import { InvestorModel } from "../models/Investor.js";

export const createUser = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
    const generateUniqueOneLink = async (baseLink, model) => {
      let uniqueLink = baseLink;
      let count = 1;
      while (await model.countDocuments({ oneLink: uniqueLink })) {
        uniqueLink = baseLink + count++;
      }
      return uniqueLink;
    };
    // Read the file from disk using xlsx.readFile
    const workbook = xlsx.readFile(file.path);

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    const addUser = async (user) => {
      const userData = await UserModel.create({
        firstName: user.firstname,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.mobileNumber,
        bio: user.bio,
        gender: user.gender === "M" ? "Male" : "Female",
        isInvestor: user.userType === "Investor" ? true : false,
        linkedin: user.user_inkedin,
        location: user.location,
        userName:
          user.firstname +
          "_" +
          Math.floor(Math.random() * Math.pow(10, 4)).toString(),
        userStatus: "active",
      });
      if (userData._id) {
        if (user.userType === "Investor") {
          let existingCompany = await InvestorModel.findOne({
            founderId: userData._id,
          });
          let baseOneLink = user.companyName.split(" ").join("").toLowerCase();
          const uniqueOneLink = await generateUniqueOneLink(
            baseOneLink,
            InvestorModel
          );

          if (existingCompany) {
            existingCompany.set({
              companyName: user.companyName,
              industry: user.industry,
              description: user.pcomany_bio,
              oneLink: uniqueOneLink,
            });
            await existingCompany.save();
          } else {
            const newInvestor = await InvestorModel.create({
              companyName: user.companyName,
              industry: user.industry,
              description: user.pcomany_bio,
              oneLink: uniqueOneLink,
              founderId: userData._id,
              linkedin: user.company_inkedin,
              logo: user.logo,
            });
            const { founderId } = newInvestor;
            await UserModel.findOneAndUpdate(
              { _id: founderId },
              {
                investor: newInvestor._id,
                location: user.location,
              }
            );
          }
        } else {
          let existingCompany = await StartUpModel.findOne({
            founderId: userData._id,
          });
          let baseOneLink = user.companyName.split(" ").join("").toLowerCase();
          const uniqueOneLink = await generateUniqueOneLink(
            baseOneLink,
            StartUpModel
          );

          if (existingCompany) {
            existingCompany.set({
              location: user.location,
              company: user.companyName,
              industry: user.industry,
              designation: user.designation,
              oneLink: uniqueOneLink,
              description: user.pcomany_bio,
            });
            await existingCompany.save();
          } else {
            const newStartUp = new StartUpModel({
              companyName: user.companyName,
              industry: user.industry,
              description: user.pcomany_bio,
              founderId: userData._id,
              oneLink: uniqueOneLink,
              linkedin: user.company_inkedin,
              logo: user.logo,
            });

            await newStartUp.save();
            const { founderId } = newStartUp;
            await UserModel.findOneAndUpdate(
              { _id: founderId },
              {
                startUp: newStartUp._id,
              }
            );
          }
        }
      }
    };
    jsonData.forEach((item) => {
      addUser(item);
    });

    return res.status(200).send(jsonData);
  } catch (err) {
    return res.status(200).send(err.message);
  }
};

export const getUsersByUserNameController = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      console.log("Username not provided in the request body.");
      return res.status(200).send({ message: "User not found" });
    }

    console.log(`Received request to get user by username: ${username}`);

    const getUser = await getUserByUserName(username);

    if (getUser.status === 404) {
      return res.status(404).send({ message: "User not found" });
    }

    return res.status(200).send(getUser.message);
  } catch (error) {
    console.error("Error in getUsersByUserNameController:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};


export const addInvestor = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
    const generateUniqueOneLink = async (baseLink, model) => {
      let uniqueLink = baseLink;
      let count = 1;
      while (await model.countDocuments({ oneLink: uniqueLink })) {
        uniqueLink = baseLink + count++;
      }
      return uniqueLink;
    };
    // Read the file from disk using xlsx.readFile
    const workbook = xlsx.readFile(file.path);

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    const addUser = async (user) => {
      const userData = await UserModel.create({
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        //phoneNumber: user.mobileNumber,
        bio: user.notes,
        //gender: user.gender === "M"? "Male":"Female",
        isInvestor: true,
        linkedin: user.urls,
        //location:user.location,
        userName:
          user.firstname +
          "_" +
          Math.floor(Math.random() * Math.pow(10, 4)).toString(),
        userStatus: "active",
        designation: user.jobTitle,
      });
      if (userData._id && user.companies) {
        let existingCompany = await InvestorModel.findOne({
          founderId: userData._id,
        });
        let baseOneLink = user.companies.split(" ").join("").toLowerCase();
        const uniqueOneLink = await generateUniqueOneLink(
          baseOneLink,
          InvestorModel
        );

        if (existingCompany) {
          existingCompany.set({
            companyName: user.companies,
            // industry:user.industry,
            // description: user.pcomany_bio,
            oneLink: uniqueOneLink,
          });
          await existingCompany.save();
        } else {
          const newInvestor = await InvestorModel.create({
            companyName: user.companies,
            //industry:user.industry,
            //description: user.pcomany_bio,
            oneLink: uniqueOneLink,
            founderId: userData._id,
            //linkedin:user.company_inkedin,
            //logo:user.logo,
          });
          const { founderId } = newInvestor;
          await UserModel.findOneAndUpdate(
            { _id: founderId },
            {
              investor: newInvestor._id,
              //location:user.location,
            }
          );
        }
      }
    };
    jsonData.forEach((item) => {
      addUser(item);
    });

    return res.status(200).send(jsonData);
  } catch (err) {
    return res.status(200).send(err.message);
  }
};

export const addStartUp_data = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
    const generateUniqueOneLink = async (baseLink, model) => {
      let uniqueLink = baseLink;
      let count = 1;
      while (await model.countDocuments({ oneLink: uniqueLink })) {
        uniqueLink = baseLink + count++;
      }
      return uniqueLink;
    };
    // Read the file from disk using xlsx.readFile
    const workbook = xlsx.readFile(file.path);

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);
    const addUser = async (user) => {
      const userData = await UserModel.create({
        firstName: user.firstname,
        lastName: user.lastName,
        email: user.email,
        //phoneNumber: user.mobileNumber,
        //bio: user.notes,
        //gender: user.gender === "M"? "Male":"Female",
        isInvestor: true,
        linkedin: user.luser_inkedin,
        //location:user.location,
        userName:
          user.firstname +
          "_" +
          Math.floor(Math.random() * Math.pow(10, 4)).toString(),
        userStatus: "active",
        designation: user.bio,
      });
      if (userData._id && user.pcompany_bio) {
        let baseOneLink = user.pcompany_bio.split(" ").join("").toLowerCase();
        const uniqueOneLink = await generateUniqueOneLink(
          baseOneLink,
          StartUpModel
        );
        const isExist = await StartUpModel.findOne({ oneLink: uniqueOneLink });
        console.log(isExist?._id);
        if (isExist) {
          await UserModel.findOneAndUpdate(
            { _id: userData._id },
            {
              startUp: isExist._id,
            }
          );
        } else {
          const newStartUp = new StartUpModel({
            company: user.pcompany_bio,
            //industry: user.industry,
            //description: user.pcomany_bio,
            founderId: userData._id,
            oneLink: uniqueOneLink,
            //linkedin: user.company_inkedin,
            //logo: user.logo,
          });

          await newStartUp.save();
          const { founderId } = newStartUp;
          await UserModel.findOneAndUpdate(
            { _id: founderId },
            {
              startUp: newStartUp._id,
            }
          );
        }
      }
    };
    jsonData.forEach((item) => {
      addUser(item);
    });
    return res.status(200).send(jsonData);
  } catch (err) {
    return res.status(200).send(err.message);
  }
};
export const getUsersController = async (req, res, next) => {
  try {
    const getUser = await getUsersService();
    return res.status(200).json(getUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch data" });
  }
};
export const sendOTP = async (req, res) => {
  try {
    const response = await axios.post(
      "https://auth.otpless.app/auth/otp/v1/send",
      {
        phoneNumber: req.body.phoneNumber,
        otpLength: 6,
        channel: "SMS",
        expiry: 600,
      },
      {
        headers: {
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          "Content-Type": "application/json",
        },
      }
    );
    return res.status(200).send({
      orderId: response.data.orderId,
      message: "OTP Send successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch data" });
  }
};
export const verifyOtp = async (req, res) => {
  try {
    const response = await axios.post(
      "https://auth.otpless.app/auth/otp/v1/verify",
      {
        orderId: req.body.orderId,
        otp: req.body.otp,
        phoneNumber: req.body.phoneNumber,
      },
      {
        headers: {
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.isOTPVerified) {
      return res.status(200).send({
        isOTPVerified: response.data.isOTPVerified,
        message: "OTP verified",
      });
    }
    return res.status(200).send({
      data: response.data,
      message: response.data.reason,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch data" });
  }
};

export const blockUserController = async (req,res)=>{
  try{

    const {userId, blockedUserId} = req.body;
    const response = await blockUser(userId,blockedUserId);
    return res.status(response.status).send(response);


  }catch(error){
    console.error("Error during blocking users", error.response? error.response.data : error.message);
    res.status(500).json({error:"Internal Server Error"})
  }

}


export const unblockUserController = async (req,res)=>{
  try{

    const {userId, unblockUserId} = req.body;
    const response = await unblockUser(userId, unblockUserId);
    return res.status(response.status).send(response);


  }catch(error){
    console.error("Error during unblocking users", error.response? error.response.data : error.message);
    res.status(500).json({error:"Internal Server Error"})
  }

}

// get user by id from body
export const getUserByIdBodyController = async (req, res) => {
  try{

    const {userId} = req.body;
    const response = await getUserByIdBody(userId);
    return res.status(response.status).send(response);


  }catch(error){
    console.error("Error", error.response? error.response.data : error.message);
    res.status(500).json({error:"Internal Server Error"})
  }
};

export const registerUserController = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      designation,
      gender,
      isInvestor,
      company,
      industry,
      location,
      foundingAsk,
      previousFounding,
      fundedTillDate,
      portfolio,
      chequeSize,
      linkedin,
    } = req.body;

    const newUser = await registerUserService({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      isInvestor,
      gender,
      linkedin,
    });

    const generateUniqueOneLink = async (baseLink, model) => {
      let uniqueLink = baseLink;
      let count = 1;
      while (await model.countDocuments({ oneLink: uniqueLink })) {
        uniqueLink = baseLink + count++;
      }
      return uniqueLink;
    };

    if (isInvestor) {
      let existingCompany = await InvestorModel.findOne({
        founderId: newUser._id,
      });
      let baseOneLink = company.split(" ").join("").toLowerCase();
      const uniqueOneLink = await generateUniqueOneLink(
        baseOneLink,
        InvestorModel
      );

      if (existingCompany) {
        existingCompany.set({
          companyName: company,
          industry,
          description: portfolio,
          oneLink: uniqueOneLink,
        });
        await existingCompany.save();
        return res
          .status(200)
          .json({ message: "Investor Updated", data: existingCompany });
      }
      const newInvestor = await InvestorModel.create({
        companyName: company,
        industry,
        description: portfolio,
        oneLink: uniqueOneLink,
        founderId: newUser._id,
        linkedin,
      });
      //await newInvestor.save();
      const { founderId } = newInvestor;
      const user = await UserModel.findOneAndUpdate(
        { _id: founderId },
        {
          investor: newInvestor._id,
          location,
        }
      );
      //  console.log("update")
      const emailMessage = `
        A new user has requested for an account:
        
        Investor Details:
        User ID: ${newUser._id}
        Name: ${newUser.firstName} ${newUser.lastName}
        Email: ${newUser.email}
        Mobile: ${phoneNumber}
        Company Name: ${newInvestor.companyName}
        Industry: ${newInvestor.industry}
        Portfolio: ${newInvestor.portfolio}
      `;
      const subject = "New Account Request";
      const adminMail = "investments.capitalhub@gmail.com";
      //"learn.capitalhub@gmail.com";
      const response = await sendMail(
        newUser.firstName,
        adminMail,
        newUser.email,
        subject,
        emailMessage
      );
      if (response.status === 200) {
        return res
          .status(200)
          .json({ message: "Investor Added", data: newUser });
      } else {
        return res.status(500).json({ message: "Error while sending mail" });
      }
      //return res.status(201).json({ message: "User added successfully" });
    } else {
      let existingCompany = await StartUpModel.findOne({
        founderId: newUser._id,
      });
      let baseOneLink = company.split(" ").join("").toLowerCase();
      const uniqueOneLink = await generateUniqueOneLink(
        baseOneLink,
        StartUpModel
      );

      if (existingCompany) {
        existingCompany.set({
          location,
          foundingAsk,
          company,
          industry,
          designation,
          oneLink: uniqueOneLink,
          founderId: newUser._id,
        });
        await existingCompany.save();
        return res
          .status(200)
          .json({ message: "Startup Updated", data: existingCompany });
      }

      const newStartUp = new StartUpModel({
        ...req.body,
        oneLink: uniqueOneLink,
      });

      await newStartUp.save();
      const { founderId } = newStartUp;
      await UserModel.findOneAndUpdate(
        { _id: founderId },
        {
          startUp: newStartUp._id,
        }
      );
      const token = jwt.sign(
        { userId: newUser._id, phoneNumber: newUser.phoneNumber },
        secretKey
      );
      return res
        .status(201)
        .json({ message: "User added successfully", data: newUser, token });
    }
  } catch ({ message }) {
    res.status(409).json({
      success: false,
      operational: true,
      message,
    });
  }
};

export const handelLinkedin = async (req, res) => {
  try {
    const response = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code: req.body.code,
          redirect_uri: "http://localhost:3000/linkedin",
          client_id: process.env.LINKEDIN_CLIENT_ID, // Set these in your environment
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );
    return res.status(200).json({ access_token: response.data.access_token });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.response ? error.response.data : "Server error" });
  }
};

export const getLinkedInProfile = async (req, res) => {
  try {
    const { accessToken } = req.body;
    console.log(accessToken);
    const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const api_url = "https://api.linkedin.com/v2/";

    const data = axios.get(
      api_url +
        "me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const ress = json.loads(data.text);
    console.log(ress);
    return res.status(200).json(response.data);
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ error: error.response ? error.response.data : "Server error" });
  }
};
export const loginUserController = async (req, res, next) => {
  try {
    const { phoneNumber, password } = req.body;
    const user = await loginUserService({
      phoneNumber,
      password,
    });

    user.password = undefined;

    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber },
      secretKey
    );

    return res
      .cookie("token", token)
      .status(200)
      .json({ message: "Login successful", user, token });
  } catch (error) {
    return res
      .status(401)
      .json({ operational: true, success: false, message: error.message });
  }
};

// get user by id
export const getUserByIdController = async (req, res) => {
  try {
    const response = await getUserById(req.params.id);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while creating the company.",
    });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { userId, body: newData } = req;
    const { status, message, data } = await updateUserData({
      userId,
      newData,
    });
    res.status(status).json({ message, data });
  } catch (error) {}
};

export const updateUserByIdController = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, message, data } = await updateUserById(userId, req.body);
    res.status(status).json({ message, data });
  } catch (error) {}
};

export const changePasswordController = async (req, res) => {
  try {
    const { userId } = req;
    const { newPassword, oldPassword } = req.body;
    const response = await changePassword(userId, { newPassword, oldPassword });
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while updating password.",
    });
  }
};

export const requestPasswordResetController = async (req, res) => {
  try {
    console.log(req.body)
    const existingUser = await UserModel.findOne({
      $or: [{ email: req.body.usernameOrEmail }, { userName: req.body.usernameOrEmail }],
    });
    if(!existingUser){
      return res.status(400).send({message:"User dose not exist"})
    }
    //const response = await requestPasswordReset(email);
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password.toString(), salt);

    await UserModel.findOneAndUpdate(
      {
        $or: [{ email: req.body.usernameOrEmail }, { userName: req.body.usernameOrEmail }],
      },
      { password: password }
    );
    return res.status(200).send({user:existingUser,status:"200"});
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while requesting a password reset" });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const response = await resetPassword(token, newPassword);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while resetting the password" });
  }
};

export const searchUsersController = async (req, res) => {
  try {
    const { searchQuery } = req.query;
    const response = await searchUsers(searchQuery);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while resetting the password" });
  }
};

// add education
export const addEducationController = async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await addEducation(userId, req.body);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while adding education.",
    });
  }
};

//add experience
export const addExperienceController = async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await addExperience(userId, req.body);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while adding experience.",
    });
  }
};

//add startup to user
export const addStartupToUserController = async (req, res) => {
  try {
    const { userId, startUpId } = req.body;
    const response = await addStartupToUser(userId, startUpId);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while adding startups to user.",
    });
  }
};

export const addUserAsInvestorController = async (req, res) => {
  try {
    const { userId, investorId } = req.body;
    const response = await addUserAsInvestor(userId, investorId);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while adding user as investor.",
    });
  }
};

export const getExploreController = async (req, res) => {
  try {
    const response = await getExplore(req.query);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while getting explore results.",
    });
  }
};

export const getExploreFiltersController = async (req, res) => {
  try {
    const { type } = req.query;
    const response = await getExploreFilters(type);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while getting explore results.",
    });
  }
};

export const validateSecretKeyController = async (req, res) => {
  try {
    const { oneLinkId, secretOneLinkKey } = req.body;
    const response = await validateSecretKey({
      oneLinkId,
      secretOneLinkKey,
    });
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while vaidating secret key.",
    });
  }
};

export const createSecretKeyController = async (req, res) => {
  try {
    const { secretOneLinkKey } = req.body;
    const userId = req.userId;
    const response = await createSecretKey(userId, secretOneLinkKey);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while creating secret key.",
    });
  }
};

export const googleLoginController = async (req, res) => {
  try {
    const { credential } = req.body;
    const response = await googleLogin(credential);
    res.status(response.status).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while login.",
    });
  }
};

export const updateEducationController = async (req, res) => {
  try {
    const userId = req.userId;
    const { educationId } = req.params;
    const response = await updateEducation(userId, educationId, req.body);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while updating education.",
    });
  }
};

export const deleteEducationController = async (req, res) => {
  try {
    const userId = req.userId;
    const { educationId } = req.params;
    const response = await deleteEducation(userId, educationId);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while deleting education.",
    });
  }
};

export const updateExperienceController = async (req, res) => {
  try {
    const userId = req.userId;
    const { experienceId } = req.params;
    const response = await updateExperience(userId, experienceId, req.body);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while updating experience.",
    });
  }
};

export const deleteExperienceController = async (req, res) => {
  try {
    const userId = req.userId;
    const { experienceId } = req.params;
    const response = await deleteExperience(userId, experienceId);
    res.status(response.status).send(response);
    return response;
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while deleting experience.",
    });
  }
};
