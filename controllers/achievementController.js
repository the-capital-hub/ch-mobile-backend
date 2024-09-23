import {
  createAchievement,
  getUserAchievements,
} from "../services/achievementService.js";

export const createAchievementController = async (req, res) => {
  try {
    const response = await createAchievement(req.body);
    res.status(response.status).send(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while creating achievement.",
    });
  }
};


export const getUserAchievementsController = async (req, res) => {
  try {
    const userId = req.userId;
    const response = await getUserAchievements(userId);
    res.status(response.status).send(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: 500,
      message: "An error occurred while getting user achievements.",
    });
  }
};