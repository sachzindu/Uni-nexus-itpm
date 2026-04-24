/**
 * Delete a comment from a post. Allowed by: comment author, post author, or group admin.
 */
const deleteComment = async (postId, commentId, userId, userRole) => {
    const post = await Post.findById(postId).populate('group');
    if (!post) throw createError(404, 'Post not found.');
    const comment = post.comments.id(commentId);
    if (!comment) throw createError(404, 'Comment not found.');

    const isCommentAuthor = comment.user.equals(userId);
    const isPostAuthor = post.author.equals(userId);
    const isPlatformAdmin = userRole === 'admin';
    let isGroupAdmin = false;
    if (post.group && post.group.admins) {
        isGroupAdmin = post.group.admins.some((admin) => admin.equals(userId));
    }

    if (!isCommentAuthor && !isPostAuthor && !isGroupAdmin && !isPlatformAdmin) {
        throw createError(403, 'You do not have permission to delete this comment.');
    }

    // Robustly remove the comment (works for all Mongoose versions)
    if (typeof comment.deleteOne === 'function') {
        comment.deleteOne();
    } else {
        post.comments.pull(commentId);
    }
    await post.save();
    logger.info(`Comment ${commentId} deleted from post ${postId} by user ${userId}`);
    return { success: true };
};
const createError = require('http-errors');
const Post = require('../models/Post');
const Group = require('../models/Group');
const logger = require('../utils/logger');

/**
 * Create a new post in a group. Only group members can post.
 */
const createPost = async (userId, groupId, postData) => {
    const group = await Group.findById(groupId);
    if (!group) throw createError(404, 'Group not found.');
    if (group.isArchived) throw createError(410, 'Cannot post in an archived group.');

    // Verify the user is a member of the group
    if (!group.members.some((m) => m.equals(userId))) {
        throw createError(403, 'You must be a member of this group to create a post.');
    }

    const post = await Post.create({
        ...postData,
        author: userId,
        group: groupId,
    });

    await post.populate('author', 'name email avatar');

    logger.info(`Post created in group ${group.name} by user ${userId}`);
    return post;
};

/**
 * Get paginated posts for a group.
 * Supports sorting by newest (default) or most upvoted.
 */
const getPostsByGroup = async (groupId, query = {}) => {
    const group = await Group.findById(groupId);
    if (!group) throw createError(404, 'Group not found.');

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Sort: 'top' for most upvoted, default is newest first
    const sortOption =
        query.sort === 'top'
            ? { upvoteCount: -1, createdAt: -1 }
            : { createdAt: -1 };

    const filter = { group: groupId };

    const [posts, total] = await Promise.all([
        Post.find(filter)
            .populate('author', 'name email avatar')
            .skip(skip)
            .limit(limit)
            .sort(sortOption),
        Post.countDocuments(filter),
    ]);

    return {
        posts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};

/**
 * Get a single post by ID.
 */
const getPostById = async (postId) => {
    const post = await Post.findById(postId)
        .populate('author', 'name email avatar')
        .populate('group', 'name')
        .populate('comments.user', 'name email avatar');

    if (!post) throw createError(404, 'Post not found.');
    return post;
};

/**
 * Update a post. Only the author can update their own post.
 */
const updatePost = async (postId, userId, updateData) => {
    const post = await Post.findById(postId);
    if (!post) throw createError(404, 'Post not found.');

    if (!post.author.equals(userId)) {
        throw createError(403, 'Only the author can update this post.');
    }

    Object.assign(post, updateData);
    await post.save();
    await post.populate('author', 'name email avatar');

    return post;
};

/**
 * Delete a post. Allowed by: author, group admin, or platform admin.
 */
const deletePost = async (postId, userId, userRole) => {
    const post = await Post.findById(postId);
    if (!post) throw createError(404, 'Post not found.');

    const isAuthor = post.author.equals(userId);
    const isPlatformAdmin = userRole === 'admin';

    // Check if user is a group admin
    let isGroupAdmin = false;
    if (!isAuthor && !isPlatformAdmin) {
        const group = await Group.findById(post.group);
        if (group) {
            isGroupAdmin = group.admins.some((admin) => admin.equals(userId));
        }
    }

    if (!isAuthor && !isGroupAdmin && !isPlatformAdmin) {
        throw createError(403, 'You do not have permission to delete this post.');
    }

    await Post.findByIdAndDelete(postId);
    logger.info(`Post ${postId} deleted by user ${userId}`);
};

/**
 * Toggle upvote on a post. If already upvoted, removes the upvote.
 * If the user has a downvote, removes it first (mutual exclusion).
 */
const toggleUpvote = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post) throw createError(404, 'Post not found.');

    const alreadyUpvoted = post.upvotes.some((id) => id.equals(userId));

    if (alreadyUpvoted) {
        // Remove upvote
        post.upvotes = post.upvotes.filter((id) => !id.equals(userId));
    } else {
        // Remove downvote if present (mutual exclusion)
        const hadDownvote = post.downvotes.some((id) => id.equals(userId));
        if (hadDownvote) {
            post.downvotes = post.downvotes.filter((id) => !id.equals(userId));
            post.downvoteCount = post.downvotes.length;
        }
        // Add upvote
        post.upvotes.push(userId);
    }

    // Keep denormalized count in sync
    post.upvoteCount = post.upvotes.length;
    await post.save();
    await post.populate('author', 'name email avatar');

    return { post, upvoted: !alreadyUpvoted };
};

/**
 * Toggle downvote on a post. If already downvoted, removes the downvote.
 * If the user has an upvote, removes it first (mutual exclusion).
 */
const toggleDownvote = async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post) throw createError(404, 'Post not found.');

    const alreadyDownvoted = post.downvotes.some((id) => id.equals(userId));

    if (alreadyDownvoted) {
        // Remove downvote
        post.downvotes = post.downvotes.filter((id) => !id.equals(userId));
    } else {
        // Remove upvote if present (mutual exclusion)
        const hadUpvote = post.upvotes.some((id) => id.equals(userId));
        if (hadUpvote) {
            post.upvotes = post.upvotes.filter((id) => !id.equals(userId));
            post.upvoteCount = post.upvotes.length;
        }
        // Add downvote
        post.downvotes.push(userId);
    }

    // Keep denormalized count in sync
    post.downvoteCount = post.downvotes.length;
    await post.save();
    await post.populate('author', 'name email avatar');

    return { post, downvoted: !alreadyDownvoted };
};

/**
 * Add a comment to a post.
 */
const addComment = async (postId, userId, content) => {
    const post = await Post.findById(postId);
    if (!post) throw createError(404, 'Post not found.');

    const comment = { user: userId, content };
    post.comments.push(comment);
    await post.save();

    // Get the newly added comment (last in array) and populate user
    const savedPost = await Post.findById(postId)
        .populate('comments.user', 'name email avatar');

    const savedComment = savedPost.comments[savedPost.comments.length - 1];

    logger.info(`Comment added to post ${postId} by user ${userId}`);
    return savedComment;
};

/**
 * Get paginated comments for a post (newest first).
 * Default: 5 comments per page.
 */
const getComments = async (postId, query = {}) => {
    const post = await Post.findById(postId)
        .populate('comments.user', 'name email avatar');

    if (!post) throw createError(404, 'Post not found.');

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 5;

    // Sort comments newest first
    const sorted = [...post.comments].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const total = sorted.length;
    const start = (page - 1) * limit;
    const paginated = sorted.slice(start, start + limit);

    return {
        comments: paginated,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Update a comment. Only the comment author can edit their own comment.
 */
const updateComment = async (postId, commentId, userId, content) => {
    const post = await Post.findById(postId).populate('comments.user', 'name email avatar');
    if (!post) throw createError(404, 'Post not found.');
    const comment = post.comments.id(commentId);
    if (!comment) throw createError(404, 'Comment not found.');

    if (!comment.user.equals(userId)) {
        throw createError(403, 'Only the comment author can edit this comment.');
    }

    comment.content = content.trim();
    await post.save();
    logger.info(`Comment ${commentId} updated on post ${postId} by user ${userId}`);
    return comment;
};

module.exports = {
    createPost,
    getPostsByGroup,
    getPostById,
    updatePost,
    deletePost,
    toggleUpvote,
    toggleDownvote,
    addComment,
    getComments,
    deleteComment,
    updateComment,
};
