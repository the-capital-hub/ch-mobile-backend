import { PostModel } from "../models/Post.js";
import { UserModel } from "../models/User.js";
import { cloudinary } from "../utils/uploadImage.js";
import { addNotification, deleteNotification } from "./notificationService.js";
import { getUserById } from "./userService.js";

const timeAgo = (date) => {
  const now = new Date();
  const seconds = Math.floor((now - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000); // Years
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return `1 year ago`;

  interval = Math.floor(seconds / 2592000); // Months
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return `1 month ago`;

  interval = Math.floor(seconds / 86400); // Days
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return `1 day ago`;

  interval = Math.floor(seconds / 3600); // Hours
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return `1 hour ago`;

  interval = Math.floor(seconds / 60); // Minutes
  if (interval > 1) return `${interval} minutes ago`;
  if (interval === 1) return `1 minute ago`;

  return `just now`; // Fallback for less than a minute
};

const base64ToBuffer = (base64String) => {  
  //const base64Data = base64String.replace(/^data:image\/jpg;base64,/, '');
  const buffer = Buffer.from(base64String, 'base64');
  return buffer
};

export const createNewPost = async (data) => {
  try {
    if (data?.images) {
      // Handle base64 images
      const imagesArray = Array.isArray(data.images) ? data.images : [data.images];
      const uploadedImages = await Promise.all(
        imagesArray.map(async (image) => {
          // Check if the image is a base64 string
         // const isBase64 = image.startsWith('data:image/');
         const isBase64 = true; 
         if (isBase64) {
            const imageBuffer = base64ToBuffer(image);
            const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`; 
            const { secure_url } = await cloudinary.uploader.upload(imageBase64, {
              folder: `${process.env.CLOUDIANRY_FOLDER}/posts/images`,
              format: "webp",
              unique_filename: true,
            });
            return secure_url;
          } else {
            // Handle regular image URLs
            const { secure_url } = await cloudinary.uploader.upload(image, {
              folder: `${process.env.CLOUDIANRY_FOLDER}/posts/images`,
              format: "webp",
              unique_filename: true,
            });
            return secure_url;
          }
        })
      );
      data.images = uploadedImages;
    }
    if (data?.video) {
      const videoBuffer = base64ToBuffer(data.video);
      const videoBase64 = `data:video/mp4;base64,${videoBuffer.toString('base64')}`
      const { secure_url } = await cloudinary.uploader.upload(videoBase64, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/posts/videos`,
        resource_type: "video",
        format: "mp4",
        unique_filename: true,
      });
      data.video = secure_url;
    }

    if (data?.documentUrl){
      const documentBuffer = base64ToBuffer(data.documentUrl);
      const documentBase64 = `data:application/pdf;base64,${documentBuffer.toString('base64')}`;
      const { secure_url } = await cloudinary.uploader.upload(documentBase64, {
        folder: `${process.env.CLOUDIANRY_FOLDER}/posts/documents`,
        format: "pdf",
        unique_filename: true,
      });
      data.documentUrl = secure_url;
    }
    if (data.resharedPostId && data.resharedPostId.length > 5) {
      const sharedPost = await PostModel.findByIdAndUpdate(
        data.resharedPostId,
        {
          $inc: { resharedCount: 1 },
        }
      );
      const type = "postShared";
      await addNotification(
        sharedPost.user,
        data.user,
        type,
        data.resharedPostId
      );
      data.resharedPostId = await PostModel.findById(
        data.resharedPostId
      ).populate("user");
    } else {
      delete data.resharedPostId;
      console.log("resharedPostId is too short to process.");
    }

    if (data.pollOptions) {
			// Ensure pollOptions is an array
			const optionsArray = Array.isArray(data.pollOptions) 
				? data.pollOptions 
				: Object.values(data.pollOptions);

			// Create poll options objects from the provided data
			const newPollOptions = optionsArray.map(optionText => ({
				option: optionText,
				votes: []  
			}));

			data.pollOptions = newPollOptions;
		 }


    const newPost = new PostModel(data);
    const post = await newPost.save();

    if (data.postType === "company") {
      const user = await UserModel.findOne({ _id: data.user });
      user.companyUpdate.push(post._id);
      await user.save();
    }
   await newPost.populate([
			{
				path: "user",
				populate: ["startUp", "investor"]
			},
			{
				path: "pollOptions",
				select: "option votes"
			}
		]);
    return newPost;
  } catch (error) {
    console.error(error);
    throw new Error("Error creating new post");
  }
};
export const allPostsData = async (page, perPage) => {
  try {
    const skip = (page - 1) * perPage;

    const allPosts = await PostModel.find()
      .populate({
        path: "user",
        select:
          "firstName lastName designation profilePicture investor startUp oneLinkId isSubscribed",
        populate: [
          { path: "investor", select: "companyName" },
          { path: "startUp", select: "company" },
        ],
      })
      .populate({
        path: "resharedPostId",
        populate: {
          path: "user",
          select:
            "firstName lastName designation profilePicture investor startUp oneLinkId",
          populate: [
            { path: "investor", select: "companyName" },
            { path: "startUp", select: "company" },
          ],
        },
      })
      .populate({
        path:"likes",
        select: "firstName lastName"
      })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(perPage);

    const posts = allPosts.map(({ _id, postType, description = "", image = "", likes, comments, createdAt, user }) => {
      const { 
        _id: userId, 
        firstName: userFirstName, 
        lastName: userLastName, 
        profilePicture: userImage, 
        designation: userDesignation, 
        investor, 
        startUp, 
        isSubscribed: userIsSubscribed 
      } = user || {};

      return {
        postId: _id,
        postType,
        description,
        image,
        likes,
        comments,
        createdAt: timeAgo(createdAt),
        userId,
        userFirstName,
        userLastName,
        userImage,
        userDesignation,
        userCompany: startUp?.company || investor?.companyName || "",
        userIsSubscribed,
      };
    });

    return posts;
  } catch (error) {
    console.error("Error fetching all posts:", error);
    throw new Error("Error fetching all posts");
  }
};

export const allPostsDataPublic = async (userIdd , page, perPage) => {
  try {
    const skip = (page - 1) * perPage;
    const user = await UserModel.findById(userIdd).populate('savedPosts.posts').exec();
    const savedPostIds = user.savedPosts.flatMap(savedPost => savedPost.posts.map(post => post._id.toString()));

    const allPosts = await PostModel.find({ postType: "public" })
      .populate({
        path: "user",
        select:
          "firstName lastName designation profilePicture investor startUp oneLinkId isSubscribed",
        populate: [
          { path: "investor", select: "companyName" },
          { path: "startUp", select: "company" },
        ],
      })
      .populate({
        path: "resharedPostId",
        populate: {
          path: "user",
          select:
            "firstName lastName designation profilePicture investor startUp oneLinkId",
          populate: [
            { path: "investor", select: "companyName" },
            { path: "startUp", select: "company" },
          ],
        },
      })
      .populate({
        path:"likes",
        select: "firstName lastName"
      })
      .populate({
        path:"comments.user",
        select:"firstName lastName designation profilePicture investor startUp",
        populate: [
          { path: "investor", select: "companyName" },
          { path: "startUp", select: "company" },
        ],
      })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(perPage);

    const posts = allPosts.map(({ _id, postType, description = "", image = "", images = [], video, documentUrl, pollOptions, likes, comments, createdAt, user }) => {
      const { 
        _id: userId, 
        firstName: userFirstName, 
        lastName: userLastName, 
        profilePicture: userImage, 
        designation: userDesignation, 
        investor, 
        startUp, 
        isSubscribed: userIsSubscribed 
      } = user || {};

      const isLiked = likes.some(like => like._id == userIdd);
      const isMyPost = userId == userIdd;
      const isSaved = savedPostIds.includes(_id.toString());

      // Combine image and images into a single array
      const combinedImages = image ? [image, ...images] : images;

      // Calculate total votes across all options
      const totalVotes = pollOptions?.reduce((sum, option) => sum + option.votes.length, 0) || 0;

      // Curate poll options
      const curatedPollOptions = pollOptions?.map(option => ({
        _id: option._id,
        option: option.option,
        numberOfVotes: option.votes.length,
        hasVoted: option.votes.includes(userIdd)
      }));

      // Get array of optionIds voted by current user
      const myVotes = pollOptions
        ?.filter(option => option.votes.includes(userIdd))
        .map(option => option._id) || [];

        const videos = video? video : "";
        const documentUrls = documentUrl? documentUrl : "";
      return {
        postId: _id,
        postType,
        isMyPost,
        description,
        isSaved,
        isLiked,
        image: combinedImages,
        video :videos,
        documentUrl :documentUrls,
        pollOptions: curatedPollOptions,
        myVotes,
        totalVotes,
        likes,
        comments: comments.map(comment => ({
          _id: comment._id,
          text: comment.text,
          user: `${comment.user.firstName} ${comment.user.lastName}`,
          userDesignation: comment.user.designation || "",
          userCompany: comment.user.investor?.companyName || comment.user.startUp?.company || "",
          userImage: comment.user.profilePicture,
          createdAt: timeAgo(comment.createdAt),
          likesCount: `${comment.likes.length}`,
          isMyComment : comment.user._id == userIdd,
          isLiked: comment.likes.some(like => like == userIdd)
        })),
        createdAt: timeAgo(createdAt),
        userId,
        userFirstName,
        userLastName,
        userImage,
        userDesignation: userDesignation || "",
        userCompany: startUp?.company || investor?.companyName || "",
        userIsSubscribed,
      };
    });

    return posts;
  } catch (error) {
    console.error("Error fetching all posts:", error);
    throw new Error("Error fetching all posts");
  }
};


export const userPost = async (user) => {
  try {
    const userData = await UserModel.findById(user);
    const allPosts = await PostModel.find({ user });
    return { allPosts, userData };
  } catch (error) {
    throw new Error("Error fetching all posts");
  }
};
export const singlePostData = async (_id) => {
  try {
    const post = await PostModel.findOne({ _id })
      .populate({
        path: "user",
        select:
          "firstName lastName designation profilePicture investor startUp oneLinkId",
        populate: [
          {
            path: "investor",
            select: "companyName",
          },
          {
            path: "startUp",
            select: "company",
          },
        ],
      })
      .populate({
        path: "resharedPostId",
        select: "",
        populate: [
          {
            path: "user",
            select:
              "firstName lastName designation profilePicture investor startUp oneLinkId",
            populate: [
              {
                path: "investor",
                select: "companyName",
              },
              {
                path: "startUp",
                select: "company",
              },
            ],
          },
        ],
      });
    return post;
  } catch (error) {
    console.error(error);
    throw new Error("Error getting post");
  }
};

//Like a post
export const likeUnlikePost = async (postId, userId) => {
  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return {
        status: false,
        message: "Post not found",
      };
    }
    const hasLiked = post.likes.includes(userId);
    if (hasLiked) {
      post.likes.pull(userId);
      const type = "postLiked";
      deleteNotification(post.user, userId, type, postId);
    } else {
      post.likes.push(userId);
      const type = "postLiked";
      await addNotification(post.user, userId, type, postId);
    }
    await post.save();
    return {
      status: true,
      message: hasLiked ? "Post Unliked" : "Post Liked",
      data: post,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while liking/unliking the post.",
    };
  }
};

// Comment on a post
export const commentOnPost = async (postId, userId, text) => {
  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return {
        message: "Post not found",
      };
    }
    const newComment = {
      user: userId,
      text,
    };
    post.comments.push(newComment);
    await post.save();
    const type = "postCommented";
    await addNotification(post.user, userId, type, postId);
    return {
      message: "Comment added successfully",
      data: post,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An error occurred while adding the comment.",
    };
  }
};

// get comments by post
export const getComments = async (postId) => {
  try {
    const post = await PostModel.findById(postId).populate({
      path: "comments.user",
      model: "Users",
      select:
        "firstName lastName designation profilePicture investor startUp oneLinkId",
      populate: [
        {
          path: "investor",
          select: "companyName",
        },
        {
          path: "startUp",
          select: "company",
        },
      ],
    });
    if (!post) {
      return {
        status: false,
        message: "Post not found",
      };
    }
    const sortedComments = post.comments.sort((a, b) => {
      if (b.likes.length !== a.likes.length) {
        return b.likes.length - a.likes.length;
      } else {
        return b.createdAt - a.createdAt;
      }
    });
    return {
      status: true,
      message: "Comments retrieved successfully",
      data: sortedComments,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while fetching comments.",
    };
  }
};

// save post
export const savePost = async (userId, collectionName, postId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }

    let collection = user.savedPosts.find((c) => c.name === collectionName);

    if (!collection) {
      collection = {
        name: collectionName,
        posts: [],
      };
      collection.posts.push(postId);
      user.savedPosts.push(collection);
      await user.save();
      return {
        status: true,
        message: "Post saved successfully",
      };
    }
    if (collection.posts.includes(postId)) {
      return {
        status: false,
        message: "Post is already in the collection",
      };
    }
    collection.posts.push(postId);
    await user.save();
    return {
      status: true,
      message: "Post saved successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while saving the post.",
    };
  }
};

export const unsavePost = async (userId, postId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    for (let i = 0; i < user.savedPosts.length; i++) {
      const collection = user.savedPosts[i];
      const postIndex = collection.posts.indexOf(postId);

      if (postIndex !== -1) {
        collection.posts.splice(postIndex, 1);
        if (collection.posts.length === 0) {
          user.savedPosts.splice(i, 1);
        }
        await user.save();
        return {
          status: true,
          message: "Post unsaved successfully",
        };
      }
    }
    return {
      status: false,
      message: "Post not found in any collection",
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while unsaving the post.",
    };
  }
};

//get all collections
export const getAllSavedPostCollections = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    const collections = user.savedPosts;
    const collectionNames = ["my saved posts", ...collections.map(c => c.name)];

    return {
      message: "Saved post collections retrieved successfully",
      data:  collections,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An error occurred while fetching saved post collections.",
    };
  }
};

export const getAllSavedPostCollectionsProfile = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    const collections = user.savedPosts;
    const collectionNames = ["my saved posts", ...collections.map(c => c.name)];

    return {
      message: "Saved post collections retrieved successfully",
      data:  collectionNames,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An error occurred while fetching saved post collections.",
    };
  }
};

//get saved post by collection name
export const getSavedPostsByCollection = async (userIdd, collectionName) => {
  try {
    const user = await UserModel.findById(userIdd);
    if (!user) {
      return {
        status: false,
        message: "User not found",
      };
    }
    
    let collection = {};
    if (collectionName === "my saved posts") {
      const posts = user.savedPosts.map((c) => c.posts);
      collection = {
        name: "my saved posts",
        posts: posts.flat(1),
      };
    } else {
      collection = user.savedPosts.find((c) => c.name === collectionName);
    }
    
    if (!collection) {
      return {
        status: false,
        message: `Collection not found`,
      };
    }
    
    const postIds = collection.posts;
    const savedPosts = await PostModel.find({ _id: { $in: postIds } })
      .populate({
        path: "user",
        select: "firstName lastName designation profilePicture investor startUp oneLinkId isSubscribed",
        populate: [
          { path: "investor", select: "companyName location" },
          { path: "startUp", select: "company location" },
        ],
      })
      .populate({
        path: "resharedPostId",
        populate: {
          path: "user",
          select: "firstName lastName designation profilePicture investor startUp oneLinkId",
          populate: [
            { path: "investor", select: "companyName" },
            { path: "startUp", select: "company" },
          ],
        },
      })
      .populate({
        path: "likes",
        select: "firstName lastName"
      })
      .populate({
        path: "comments.user",
        select: "firstName lastName designation profilePicture investor startUp",
        populate: [
          { path: "investor", select: "companyName" },
          { path: "startUp", select: "company" },
        ],
      })
      .sort({ _id: -1 })
      .exec();

      const posts = savedPosts.map(({ _id, postType, description = "", image = "", images = [], pollOptions, likes, comments, createdAt, user }) => {
        const { 
          _id: userId, 
          firstName: userFirstName, 
          lastName: userLastName, 
          profilePicture: userImage, 
          designation: userDesignation, 
          investor, 
          startUp, 
          isSubscribed: userIsSubscribed 
        } = user || {};
  
        const isLiked = likes.some(like => like._id == userIdd);
        const isMyPost = userId == userIdd;

        // Combine image and images into a single array
        const combinedImages = image ? [image, ...images] : images;
  
        // Calculate total votes across all options
        const totalVotes = pollOptions?.reduce((sum, option) => sum + option.votes.length, 0) || 0;
  
        // Curate poll options
        const curatedPollOptions = pollOptions?.map(option => ({
          _id: option._id,
          option: option.option,
          numberOfVotes: option.votes.length,
          hasVoted: option.votes.includes(userIdd)
        }));
  
        // Get array of optionIds voted by current user
        const myVotes = pollOptions
          ?.filter(option => option.votes.includes(userIdd))
          .map(option => option._id) || [];
  
        return {
          postId: _id,
          userProfilePicture: user.profilePicture,
          userDesignation: user.designation,
          userFirstName: user.firstName,
          userLastName: user.lastName,
          userLocation: startUp? startUp.location : investor? investor.location : " ",
          description,
          images: combinedImages, 
          pollOptions: curatedPollOptions,
          myVotes,
          totalVotes,
          age : timeAgo(createdAt),
        };
      });

    return {
      status: true,
      message: `Saved posts retrieved successfully`,
      data: posts,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while fetching saved posts by collection name.",
    };
  }
};


//get like count
export const getLikeCount = async (postId) => {
  try {
    const post = await PostModel.findById(postId).populate("likes");
    if (!post) {
      return {
        status: false,
        message: "Post not found",
      };
    }
    const likeCount = post.likes.length;
    let likedBy;
    if (likeCount === 0) {
      likedBy = null;
    } else if (likeCount === 1) {
      const user = post.likes[0];
      likedBy = user ? user.firstName : "Unknown User";
    } else {
      const usersWhoLiked = post.likes.slice(0, 2);
      const otherCount = likeCount - 2;
      likedBy = usersWhoLiked.map((user) => user.firstName).join(", ");
      if (otherCount > 0) {
        likedBy += `, and ${otherCount} others`;
      }
    }

    return {
      status: true,
      message: `${likeCount} ${
        likeCount === 1 ? "person" : "people"
      } liked this post`,
      data: {
        count: likeCount,
        likedBy,
        users: post.likes,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while fetching like count",
    };
  }
};

// get users who liked the post
export const getUsersWhoLikedPost = async (postId) => {
  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return {
        status: false,
        message: "Post not found",
      };
    }
    const likedUsers = await PostModel.findById(postId).populate({
      path: "likes",
      select: "firstName lastName profilePicture oneLinkId",
    });
    return {
      status: true,
      message: "Users who liked the post retrieved successfully",
      data: likedUsers.likes,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while fetching liked users.",
    };
  }
};

export const deletePost = async (postId, userId) => {
  try {
    const deletedPost = await PostModel.findOneAndDelete({
      _id: postId,
      user: userId,
    });
    const user = await UserModel.findOne({ _id: userId });
    if (user.companyUpdate.includes(postId)) {
      user.companyUpdate.filter((id) => id !== postId);
      user.save();
    }
    if (!deletedPost) {
      return {
        status: false,
        message: "Post not found.",
      };
    }
    return {
      status: true,
      message: "Post Deleted Successfully",
      data: deletedPost,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while deleting posts.",
    };
  }
};
export const addToCompanyUpdate = async (postId, userId) => {
  try {
    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      return {
        status: false,
        message: "User not found.",
      };
    }
    if (user.companyUpdate.includes(postId)) {
      return {
        status: false,
        message: "Post is already in featured posts.",
      };
    }

    user.companyUpdate.push(postId);
    await user.save();
    await PostModel.findOneAndUpdate({ _id: postId }, { postType: "company" });
    return {
      status: true,
      message: "Post added to featured posts",
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while adding the post to featured posts.",
    };
  }
};
export const addToFeaturedPost = async (postId, userId) => {
  try {
    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      return {
        status: false,
        message: "User not found.",
      };
    }
    if (user.featuredPosts.includes(postId)) {
      return {
        status: false,
        message: "Post is already in featured posts.",
      };
    }
    user.featuredPosts.push(postId);
    await user.save();

    return {
      status: true,
      message: "Post added to featured posts",
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while adding the post to featured posts.",
    };
  }
};

export const getCompanyUpdateByUser = async (userId) => {
  try {
    const user = await UserModel.findById(userId).populate("companyUpdate");

    if (!user) {
      return {
        status: false,
        message: "User not found.",
        companyUpdate: [],
      };
    }

    return {
      status: true,
      message: "Featured posts retrieved successfully.",
      user,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while retrieving featured posts.",
      companyUpdate: [],
    };
  }
};
export const getFeaturedPostsByUser = async (userId) => {
  try {
    const user = await UserModel.findById(userId).populate("featuredPosts");

    if (!user) {
      return {
        status: false,
        message: "User not found.",
        featuredPosts: [],
      };
    }

    return {
      status: true,
      message: "Featured posts retrieved successfully.",
      user,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while retrieving featured posts.",
      featuredPosts: [],
    };
  }
};

export const removeCompanyUpdatePost = async (postId, userId) => {
  try {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { companyUpdate: postId } },
      { new: true }
    );
    await PostModel.findOneAndUpdate({ _id: postId }, { postType: "public" });
    if (!user) {
      return {
        status: false,
        message: "User not found.",
      };
    }

    return {
      status: true,
      message: "Post removed from featured posts.",
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while removing the post from featured posts.",
    };
  }
};
export const removeFromFeaturedPost = async (postId, userId) => {
  try {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { featuredPosts: postId } },
      { new: true }
    );

    if (!user) {
      return {
        status: false,
        message: "User not found.",
      };
    }

    return {
      status: true,
      message: "Post removed from featured posts.",
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while removing the post from featured posts.",
    };
  }
};

export const deleteComment = async (postId, commentId, userId) => {
  try {
    const post = await PostModel.findById(postId);

    if (!post) {
      return {
        message: "Post not found.",
      };
    }

    const type = "postCommented";
    await deleteNotification(post.user, userId, type, postId);

    const commentIndex = post.comments.findIndex((comment) =>
      comment._id.equals(commentId)
    );
    if (commentIndex === -1) {
      return {
        message: "Comment not found.",
      };
    }
    post.comments.splice(commentIndex, 1);
    await post.save();
    return {
      message: "Comment deleted successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An error occurred while deleting the comment.",
    };
  }
};

export const toggleCommentLike = async (postId, commentId, userId) => {
  try {
    const post = await PostModel.findById(postId);
    if (!post) {
      return {
        status: false,
        message: "Post not found",
      };
    }
    const comment = post.comments.id(commentId);
    if (!comment) {
      return {
        status: false,
        message: "Comment not found",
      };
    }
    const likedIndex = comment.likes.indexOf(userId);
    let likeStatusMessage = "";

    if (likedIndex === -1) {
      comment.likes.push(userId);
      likeStatusMessage = "Comment liked successfully";
    } else {
      comment.likes.splice(likedIndex, 1);
      likeStatusMessage = "Comment unliked successfully";
    }

    await post.save();

    const likeCount = comment.likes.length;
    return {
      status: true,
      message: likeStatusMessage,
      likeCount: likeCount,
    };
  } catch (error) {
    console.error(error);
    return {
      status: false,
      message: "An error occurred while toggling the comment like status.",
    };
  }
};


export const getPostById = async (postId) => {
  try{
   const post = await PostModel.findById(postId)
   if (!post) {
    return {
      status: false,
      message: "Post not found.",
    };
  }

  return {
    status: true,
    message: "Post removed from featured posts.",
    data:post
  };
  }catch(error){
    return {
      status: false,
      message:"An error occurred while toggling the comment like status.",
    }
  }
}


export const voteForPoll = async(postId, optionId, userId) => {
	try {
		const post = await PostModel.findById(postId);
		
		if (!post) {
			return {
				status: false,
				message: "Post Not Found"
			}
		}

		const option = post.pollOptions.id(optionId);
		
		if (!option) {
			return {
				status: false,
				message: "Option Not Found"
			}
		}

		// Check if user has already voted
		const voteIndex = option.votes.indexOf(userId);
		const hasVoted = voteIndex !== -1;

		if (hasVoted) {
			// Remove vote
			option.votes.splice(voteIndex, 1);
		} else {
			// Add vote
			option.votes.push(userId);
		}

		// Save the updated post
    await post.save();
		
		// Calculate total votes and format poll options
		const totalVotes = post.pollOptions.reduce((sum, opt) => sum + opt.votes.length, 0);
		const formattedPollOptions = post.pollOptions.map(opt => ({
			_id: opt._id,
			option: opt.option,
			numberOfVotes: opt.votes.length,
			hasVoted: opt.votes.includes(userId)
		}));

		return {
			status: true,
			message: hasVoted ? "Vote removed successfully" : "Vote added successfully",
			data: {
				pollOptions: formattedPollOptions,
				totalVotes,
				myVotes: post.pollOptions
					.filter(opt => opt.votes.includes(userId))
					.map(opt => opt._id)
			}
		}
	} catch (error) {
		console.error("Error voting for poll:", error);
		return {
			status: false,
			message: "An error occurred while voting for poll"
		}
	}
}