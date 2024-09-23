import { AchievementsModel } from "../models/Achievement.js";
import { UserModel } from "../models/User.js";

export const createAchievement = async (achievementData) => {
  try {
    const achievement = new AchievementsModel({
      ...achievementData
    });
    await achievement.save();
    return {
      status: 200,
      message: "Achievement Added",
      data: achievement,
    }
  } catch (error) {
    console.error("Error creating Achievement:", error);
    return {
      status: 500,
      message: "An error occurred while creating Achievement.",
    };
  }
}

// Function to get all user achievements
export const getUserAchievements = async (userId) => {
  try {
    const userAchievements = await UserModel.findById(userId).populate('achievements');
    const userAchievementIds = userAchievements.achievements.map(achievement => achievement._id);
    let incompleteAchievements = await AchievementsModel.find({ _id: { $nin: userAchievementIds } });

    incompleteAchievements = incompleteAchievements.sort((a, b) => {
      const badgeOrder = { bronze: 1, silver: 2, gold: 3 };
      return badgeOrder[a.badge] - badgeOrder[b.badge];
    });

    return {
      status: 200,
      message: "User Achievements Retrieved",
      data: {
        completed: userAchievements.achievements,
        incomplete: incompleteAchievements,
      }
    };
  } catch (error) {
    console.error("Error getting user achievements:", error);
    return {
      status: 500,
      message: "An error occurred while getting user achievements.",
    };
  }
};
