import { ArticleModel } from "../models/article.js";

export const addArticle = async (req, res) => {
  try {
    const { content } = req.body;
    console.log(content)
    const data = await ArticleModel.create({ user: req.userId, content });
    return res.status(201).send(data);
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while creating chat.",
    });
  }
};
