import express from 'express';
import { getAllNews, getTopHeadlines, getCountryHeadlines, getNewsByDate, getTodaysNews } from '../controllers/newsController.js';


const newsRouter = express.Router();

newsRouter.get("/all-news", getAllNews);
newsRouter.get("/top-headlines", getTopHeadlines);
newsRouter.get("/country/:iso", getCountryHeadlines);
newsRouter.get("/getNewsByDate", getNewsByDate);
newsRouter.get("/getTodaysNews",getTodaysNews);

export default newsRouter;
