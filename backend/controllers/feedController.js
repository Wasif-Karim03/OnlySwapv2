import FeedPost from '../models/FeedPost.js';
import FeedComment from '../models/FeedComment.js';
import ChatThread from '../models/ChatThread.js';
import User from '../models/User.js';

export const createPost = async (req, res) => {
  try {
    const { content, isAnonymous } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Content cannot exceed 1000 characters',
      });
    }

    const post = await FeedPost.create({
      userId: req.user.userId,
      university: req.user.university,
      content: content.trim(),
      isAnonymous: isAnonymous !== false, // Default to true
    });

    // Populate user info for response (for admin purposes, but hide from regular users)
    const populatedPost = await FeedPost.findById(post._id)
      .populate('userId', 'firstName lastName university');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost,
    });
  } catch (err) {
    console.error('❌ Create post error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: err.message,
    });
  }
};

export const getFeedByUniversity = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Filter out deleted posts for regular users
    const posts = await FeedPost.find({ 
      university: req.user.university,
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName university')
      .populate('likes', 'firstName lastName');

    // Format posts to hide user identity from regular users
    const formattedPosts = posts.map((post) => {
      const postObj = post.toObject();
      
      // Check if current user has liked this post (before deleting likes)
      const userLiked = postObj.likes && postObj.likes.some(
        (likeId) => likeId.toString() === userId.toString()
      );
      postObj.userLiked = userLiked || false;
      
      // Store user ID for frontend to check if user owns the post (before hiding)
      const postOwnerId = postObj.userId ? postObj.userId._id || postObj.userId.toString() : null;
      
      // Hide user identity for anonymous posts (but keep _id for ownership check)
      if (postObj.isAnonymous) {
        // Keep a minimal userId with just _id for ownership checks
        postObj.userId = postOwnerId ? { _id: postOwnerId } : null;
      }
      
      // Return like count but not full user list for privacy
      postObj.likeCount = postObj.likes ? postObj.likes.length : 0;
      delete postObj.likes; // Don't expose who liked it
      
      return postObj;
    });

    res.json({
      success: true,
      count: formattedPosts.length,
      data: formattedPosts,
    });
  } catch (err) {
    console.error('❌ Get feed error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching feed',
      error: err.message,
    });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await FeedPost.findOne({ 
      _id: id,
      isDeleted: false 
    });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // CRITICAL: Verify post is from user's university
    if (post.university !== req.user.university) {
      return res.status(403).json({
        success: false,
        message: 'You can only like posts from your university',
      });
    }

    // Check if user already liked
    if (post.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked',
      });
    }

    post.likes.push(userId);
    await post.save();

    res.json({
      success: true,
      message: 'Post liked',
      data: {
        likeCount: post.likes.length,
      },
    });
  } catch (err) {
    console.error('❌ Like post error:', err);
    res.status(500).json({
      success: false,
      message: 'Error liking post',
      error: err.message,
    });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await FeedPost.findOne({ 
      _id: id,
      isDeleted: false 
    });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // CRITICAL: Verify post is from user's university
    if (post.university !== req.user.university) {
      return res.status(403).json({
        success: false,
        message: 'You can only unlike posts from your university',
      });
    }

    // Check if user liked
    if (!post.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Post not liked',
      });
    }

    post.likes = post.likes.filter(
      (likeId) => likeId.toString() !== userId.toString()
    );
    await post.save();

    res.json({
      success: true,
      message: 'Post unliked',
      data: {
        likeCount: post.likes.length,
      },
    });
  } catch (err) {
    console.error('❌ Unlike post error:', err);
    res.status(500).json({
      success: false,
      message: 'Error unliking post',
      error: err.message,
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isAnonymous, parentCommentId } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters',
      });
    }

    // Verify post exists and belongs to user's university
    const post = await FeedPost.findOne({ 
      _id: id,
      isDeleted: false 
    });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // CRITICAL: Verify post is from user's university
    if (post.university !== req.user.university) {
      return res.status(403).json({
        success: false,
        message: 'You can only comment on posts from your university',
      });
    }

    // If this is a reply, verify parent comment exists and belongs to the same post
    if (parentCommentId) {
      const parentComment = await FeedComment.findOne({ 
        _id: parentCommentId,
        isDeleted: false 
      });
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
        });
      }
      if (parentComment.postId.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: 'Parent comment does not belong to this post',
        });
      }
    }

    // Create comment (or reply)
    const comment = await FeedComment.create({
      postId: id,
      userId: userId,
      parentCommentId: parentCommentId || null,
      university: req.user.university,
      content: content.trim(),
      isAnonymous: isAnonymous !== false, // Default to true
    });

    // Update post comment count (including replies)
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    // Populate user for response
    const populatedComment = await FeedComment.findById(comment._id)
      .populate('userId', 'firstName lastName university')
      .populate('parentCommentId', 'content');

    res.status(201).json({
      success: true,
      message: parentCommentId ? 'Reply added successfully' : 'Comment added successfully',
      data: populatedComment,
    });
  } catch (err) {
    console.error('❌ Add comment error:', err);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: err.message,
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify post exists and belongs to user's university
    const post = await FeedPost.findOne({ 
      _id: id,
      isDeleted: false 
    });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // CRITICAL: Verify post is from user's university
    if (post.university !== req.user.university) {
      return res.status(403).json({
        success: false,
        message: 'You can only view comments on posts from your university',
      });
    }

    // Get all comments (top-level and replies) - filter out deleted comments
    const allComments = await FeedComment.find({ 
      postId: id,
      isDeleted: false 
    })
      .sort({ createdAt: 1 }) // Oldest first
      .populate('userId', 'firstName lastName university')
      .populate('parentCommentId', 'content');

    // Format comments to hide user identity
    const formattedComments = allComments.map((comment) => {
      const commentObj = comment.toObject();
      
      // Hide user identity for anonymous comments
      if (commentObj.isAnonymous) {
        delete commentObj.userId;
      }
      
      // Hide parent comment user info if anonymous
      if (commentObj.parentCommentId && commentObj.parentCommentId.isAnonymous) {
        // Keep parent comment content but hide user info
        if (commentObj.parentCommentId.userId) {
          delete commentObj.parentCommentId.userId;
        }
      }
      
      return commentObj;
    });

    // Organize into nested structure: top-level comments with replies
    const topLevelComments = formattedComments.filter(c => !c.parentCommentId);
    const replies = formattedComments.filter(c => c.parentCommentId);

    // Attach replies to their parent comments
    const commentsWithReplies = topLevelComments.map(comment => {
      const commentReplies = replies
        .filter(reply => reply.parentCommentId && reply.parentCommentId._id.toString() === comment._id.toString())
        .map(reply => {
          // Remove parentCommentId from reply object for cleaner frontend
          const { parentCommentId, ...replyWithoutParent } = reply;
          return replyWithoutParent;
        });
      
      return {
        ...comment,
        replies: commentReplies,
      };
    });

    res.json({
      success: true,
      count: formattedComments.length,
      data: commentsWithReplies,
    });
  } catch (err) {
    console.error('❌ Get comments error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: err.message,
    });
  }
};

export const startChat = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    // Get the post
    const post = await FeedPost.findOne({ 
      _id: id,
      isDeleted: false 
    }).populate('userId');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const postOwnerId = post.userId._id.toString();

    // Check if user is trying to chat with themselves
    if (currentUserId === postOwnerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start chat with yourself',
      });
    }

    // Check if chat thread already exists for feed posts
    // Look for threads between these users without a product (feed post chats)
    // Try both directions since buyer/seller can be either user
    let thread = await ChatThread.findOne({
      productId: null,
      $or: [
        { buyerId: currentUserId, sellerId: postOwnerId },
        { buyerId: postOwnerId, sellerId: currentUserId },
      ],
    });

    if (!thread) {
      // Create new thread - current user is buyer, post owner is seller
      try {
        thread = await ChatThread.create({
          productId: null, // Feed post chats don't need product
          buyerId: currentUserId,
          sellerId: postOwnerId,
          lastMessage: `Started chat from feed post`,
          lastMessageAt: new Date(),
        });
      } catch (createError) {
        // If creation fails due to duplicate, try to find it again
        if (createError.code === 11000) {
          thread = await ChatThread.findOne({
            productId: null,
            $or: [
              { buyerId: currentUserId, sellerId: postOwnerId },
              { buyerId: postOwnerId, sellerId: currentUserId },
            ],
          });
        } else {
          throw createError;
        }
      }
    }

    // Populate user info
    const populatedThread = await ChatThread.findById(thread._id)
      .populate('buyerId', 'firstName lastName university')
      .populate('sellerId', 'firstName lastName university');

    res.json({
      success: true,
      message: 'Chat thread found/created',
      data: {
        threadId: populatedThread._id,
        thread: populatedThread,
      },
    });
  } catch (err) {
    console.error('❌ Start chat error:', err);
    res.status(500).json({
      success: false,
      message: 'Error starting chat',
      error: err.message,
    });
  }
};

