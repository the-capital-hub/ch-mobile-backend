import jwt from "jsonwebtoken";
import { secretKey } from "../constants/config.js";
import { UserModel } from "../models/User.js";

export const authenticateToken = async (req, res, next) => {
  const token = req.headers?.authorization?.replace("Bearer ", "");
  if (!token) {
    throw new Error("Unauthorized user");
  }
  try {
    // Verify the token synchronously and get the user details
    const { userId } = jwt.verify(token, secretKey);
    const foundUser = await UserModel.findOne({ _id: userId });
    if (!foundUser) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }

    // Set the user object in the request
    req.userId = userId;

    next();
  } catch (error) {
    // console.error("Token verification error:", error);
    return res.status(403).send({
      success: false,
      message: "Unauthorized User",
      error: error.message,
    });
  }
};
