import { UserModel } from "../models/User.js";

export const checkSubscription = async (req, res, next) => {
  const userId = req.userId;
  const user = await UserModel.findById(userId);

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  const trialPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const currentDate = new Date();
  const trialEndDate = new Date(user.trialStartDate.getTime() + trialPeriod);

  if (user.isSubscribed || currentDate < trialEndDate) {
    next();
  } else {
    return res.status(403).json({ message: "Trial period has ended. Please subscribe." });
  }
};
