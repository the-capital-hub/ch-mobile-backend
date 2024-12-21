import express from 'express';
import { getAllNews, getTopHeadlines, getCountryHeadlines, getNewsByDate, getTodaysNews, getNews, getMoreNews } from '../controllers/newsController.js';


const newsRouter = express.Router();

newsRouter.get("/all-news", getAllNews);
newsRouter.get("/top-headlines", getTopHeadlines);
newsRouter.get("/country/:iso", getCountryHeadlines);
newsRouter.get("/getNewsByDate", getNewsByDate);
newsRouter.get("/getTodaysNews",getTodaysNews);
//newsRouter.get("/inshort-news", getNews);
newsRouter.get("/inshort-news", getMoreNews);

export default newsRouter;
