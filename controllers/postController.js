import {
  allPostsData,
  createNewPost,
  singlePostData,
  likeUnlikePost,
  commentOnPost,
  getComments,
  savePost,
  getAllSavedPostCollections,
  getSavedPostsByCollection,
  getLikeCount,
  getUsersWhoLikedPost,
  deletePost,
  addToFeaturedPost,
  getFeaturedPostsByUser,
  removeFromFeaturedPost,
  deleteComment,
  unsavePost,
  toggleCommentLike,
  addToCompanyUpdate,
  getCompanyUpdateByUser,
  removeCompanyUpdatePost,
  userPost,
  getPostById,
  allPostsDataPublic,
  voteForPoll,
  getAllSavedPostCollectionsProfile,
} from "../services/postService.js";
import { UserModel } from "../models/User.js";

export const update_all = async (req, res) => {
  try {
    const data = await UserModel.updateMany(
      {},
      {
        companyUpdate:[]
      },
      { new: true }
    );
    return res.status(201).send(data);
  } catch (err) {
    return res.status(500).send(err.message);
  }
};
export const createPost = async (req, res) => {
  try {
    const newPost = await createNewPost({
      ...req.body,
      user: req.userId,
    });
    res.send({
      message: "Post created succesfully",
      data: newPost,
    });
  } catch (err) {
    console.error("Error creating new post: ", err);
    res.status(500).send(err);
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const { page, perPage } = req.query;
    const pageNumber = parseInt(page) || 1;
    const postsPerPage = parseInt(perPage) || 10; 
    const data = await allPostsData(pageNumber, postsPerPage);
    if (!data.length) {
      res.status(404).send({
        message: "No Posts yet",
      });
    } else {
      res.send({status:true, message: "Posts fetched successfully", data });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({status: false, message:err, data:{}});
  }
};

export const getAllPostsPublic = async (req, res) => {
  try {
    const { page, perPage } = req.query;
    const user = req.userId;
    const pageNumber = parseInt(page) || 1;
    const postsPerPage = parseInt(perPage) || 10; 
    const data = await allPostsDataPublic(user ,pageNumber, postsPerPage);
    if (!data.length) {
      res.send({
        status:false,
        message: "No Posts yet",
      });
    } else {
      res.send({status:true, message: "Posts fetched successfully", data });
    }
  } catch (err) {
    console.log(err);
    res.send({status: false, message:err, data:{}});
  }
};

export const getUserPost = async (req,res)=>{
  try{
   const data = await userPost(req.userId)
   if (!data.allPosts.length) {
    res.status(404).send({
      message: "No Posts yet",
    });
  } else {
    res.send({ message: "Posts fetched successfully", data });
  }
  }catch(err){
    res.status(500).send(err);
  }
}
export const getSinglePost = async (req, res) => {
  try {
    const data = await singlePostData(req.params.id);
    if (!data) {
      res.status(404).send({ message: "No post found" });
    } else {
      res.send({ message: "Post fetched succesfully", data });
    }
  } catch (err) {
    res.status(500).send(err);
  }
};

// like or unlike a post
export const likeUnlikePostController = async (req, res) => {
  try {
    const { postId } = req.params;
    // const { userId } = req.body;
    const response = await likeUnlikePost(postId, req.userId);
    return res.send({...response})
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while liking/unliking the post.",
    });
  }
};

// Comment on a post
export const commentOnPostController = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, text } = req.body;
    const response = await commentOnPost(postId, userId, text);
    return res.send({status: true, ...response});
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "An error occurred while adding the comment.",
    });
  }
};

//get comments
export const getCommentsController = async (req, res) => {
  try {
    const { postId } = req.params;
    const response = await getComments(postId);
    res.send({...response})
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: "An error occurred while fetching comments.",
    };
  }
};

//save a post
export const savePostController = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, collectionName } = req.body;
    const response = await savePost(userId, collectionName, postId);
    return res.send({...response});
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "An error occurred while saving the post.",
    });
  }
};

export const unsavePostController = async (req, res) => {
  try {
    const userId = req.userId
    const { postId } = req.body;
    const response = await unsavePost(userId, postId);
    return res.send({...response});
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: "An error occurred while unsaving the post.",
    });
  }
};

//get saved post
export const getAllSavedPostCollectionsController = async (req, res) => {
  try {
    const userId = req.params.userId;
    const response = await getAllSavedPostCollections(userId);
    return res.send({status:true, ...response});
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: "An error occurred while getting saved post collections.",
    });
  }
};

export const getAllSavedPostCollectionsProfileController = async (req, res) => {
  try {
    const userId = req.userId;
    const response = await getAllSavedPostCollectionsProfile(userId);
    return res.send({status:true, ...response});
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: "An error occurred while getting saved post collections.",
    });
  }
};

//get saved post by collection
export const getSavedPostsByCollectionController = async (req, res) => {
  try {
    const userId = req.userId;
    const { collectionName } = req.body;
    const response = await getSavedPostsByCollection(userId, collectionName);
    return res.send({...response});
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: "An error occurred getting saved post.",
    });
  }
};

//get likes count
export const getLikeCountController = async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await getLikeCount(postId);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting likes count.",
    });
  }
};

//get users who liked the post
export const getUsersWhoLikedPostController = async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await getUsersWhoLikedPost(postId);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting liked users.",
    });
  }
};

//delete post
export const deletedPostController = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const result = await deletePost(postId, userId);
    return res.json(result);
  } catch (error) {
    console.log(error);
    return res.send({
      status: false,
      message: "An error occurred while deleting posts.",
    });
  }
};

export const addToCompanyUpdateController = async (req,res)=>{
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const result = await addToCompanyUpdate(postId, userId);
    return res.json({status: true, ...result});
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status:false,
      message: "An error occurred while adding post as featured.",
    });
  }
}
export const addToFeaturedPostController = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const result = await addToFeaturedPost(postId, userId);
    return res.json({status: true, ...result});
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: false,
      message: "An error occurred while adding post as featured.",
    });
  }
};

export const getCompanyUpdateByUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await getCompanyUpdateByUser(userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting featured post.",
    });
  }
};
export const getFeaturedPostsByUserController = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await getFeaturedPostsByUser(userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "An error occurred while getting featured post.",
    });
  }
};

export const removeCompanyUpdatePostController = async (req,res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const result = await removeCompanyUpdatePost(postId, userId);
    return res.json(result);
  } catch (error) {
    console.log(error);
    return res.send({
      status: false,
      message: "An error occurred while removing featured post.",
    });
  } 
}
export const removeFromFeaturedPostController = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const result = await removeFromFeaturedPost(postId, userId);
    return res.json(result);
  } catch (error) {
    console.log(error);
    return res.send({
      status: false,
      message: "An error occurred while removing featured post.",
    });
  }
};

export const deleteCommentController = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.userId;
    const result = await deleteComment(postId, commentId, userId);
    return res.json({status: true, ...result});
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while deleting the comment.",
    });
  }
};

export const toggleCommentLikeController = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.userId;
    const response = await toggleCommentLike(postId, commentId, userId);
    return res.status(response.status).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "An error occurred while liking the comment.",
    });
  }
};

export const getPost = async (req,res) =>{
  try{
    const response = await getPostById(req.body.postId)
    return res.status(response.status).json(response.data)
  } catch (error){
    return res.json({
      status:false,
     message: "An error occurred while liking the comment.",
    })
  }
}

export const voteForPollController = async(req,res)=>{
  try{
    const {postId, optionId} = req.body;
    const response = await voteForPoll(postId, optionId, req.userId)
    return res.json(response);
  }catch (error){
    console.log(error);
    return res.json({
      status:false,
     message: error,
    })
  }
}