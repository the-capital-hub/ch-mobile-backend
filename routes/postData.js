import express from "express";
import {
  createPost,
  getAllPosts,
  getSinglePost,
  savePostController,
  getAllSavedPostCollectionsController,
  getSavedPostsByCollectionController,
  likeUnlikePostController,
  commentOnPostController,
  getCommentsController,
  getLikeCountController,
  getUsersWhoLikedPostController,
  deletedPostController,
  addToFeaturedPostController,
  addToCompanyUpdateController,
  getFeaturedPostsByUserController,
  getCompanyUpdateByUserController,
  removeFromFeaturedPostController,
  deleteCommentController,
  unsavePostController,
  toggleCommentLikeController,
  removeCompanyUpdatePostController,
  getUserPost,
  getPost
} from "../controllers/postController.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";
const router = express.Router();

router.use(authenticateToken);

router.get("/getposts", getAllPosts);
router.get("/get_post_by_id",getPost);
router.get("/getSinglePost/:id", getSinglePost);
router.get("/user_post",getUserPost)
// Single user routes
router.post("/newPost", createPost);
// router.patch("/oldsavePost/:postId", savePost);
router.patch("/savePost/:postId", savePostController);
router.patch("/unsavePost", unsavePostController);
router.get("/getSavedPostCollections/:userId", getAllSavedPostCollectionsController);
router.post("/getSavedPostsByCollection/:userId", getSavedPostsByCollectionController);

router.post("/likeUnlikePost/:postId", likeUnlikePostController);
router.get('/likeCount/:postId', getLikeCountController);
router.get('/likedUsers/:postId', getUsersWhoLikedPostController);
router.post("/comment/:postId", commentOnPostController);
router.get("/getComments/:postId", getCommentsController);
router.post("/toggleLikeComment/:postId/:commentId", toggleCommentLikeController);
router.delete("/deleteComment/:postId/:commentId", deleteCommentController);

router.delete("/deletePost/:postId", deletedPostController);
router.post("/addToCompanyUpdatePost/:postId",addToCompanyUpdateController)
router.post("/addToFeaturedPost/:postId", addToFeaturedPostController);
router.get("/getFeaturedPostsByUser/:userId", getFeaturedPostsByUserController);
router.get("/getCompanyUpdatePosts/:userId",getCompanyUpdateByUserController)
router.delete("/removeFromFeaturedPost/:postId", removeFromFeaturedPostController);
router.delete("/removeCompanyUpdatePost/:postId",removeCompanyUpdatePostController)

export default router;