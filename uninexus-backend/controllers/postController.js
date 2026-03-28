/**
 * @desc    Delete a comment from a post
 * @route   DELETE /api/groups/:groupId/posts/:postId/comments/:commentId
 * @access  Private (Comment author, Post author, Group Admin, Platform Admin)
 */
const deleteComment = async (req, res, next) => {
    try {
        await postService.deleteComment(
            req.params.postId,
            req.params.commentId,
            req.user._id,
            req.user.role
        );
        res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        next(error);
    }
};
const postService = require('../services/postService');

/**
 * @desc    Create a new post in a group
 * @route   POST /api/groups/:groupId/posts
 * @access  Private (Group Member)
 */
const createPost = async (req, res, next) => {
    try {
        const post = await postService.createPost(
            req.user._id,
            req.params.groupId,
            req.body
        );
        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: { post },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all posts for a group
 * @route   GET /api/groups/:groupId/posts
 * @access  Private
 */
const getPostsByGroup = async (req, res, next) => {
    try {
        const result = await postService.getPostsByGroup(
            req.params.groupId,
            req.query
        );
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single post
 * @route   GET /api/groups/:groupId/posts/:postId
 * @access  Private
 */
const getPostById = async (req, res, next) => {
    try {
        const post = await postService.getPostById(req.params.postId);
        res.status(200).json({ success: true, data: { post } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a post
 * @route   PUT /api/groups/:groupId/posts/:postId
 * @access  Private (Author only)
 */
const updatePost = async (req, res, next) => {
    try {
        const post = await postService.updatePost(
            req.params.postId,
            req.user._id,
            req.body
        );
        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            data: { post },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a post
 * @route   DELETE /api/groups/:groupId/posts/:postId
 * @access  Private (Author, Group Admin, Platform Admin)
 */
const deletePost = async (req, res, next) => {
    try {
        await postService.deletePost(
            req.params.postId,
            req.user._id,
            req.user.role
        );
        res.status(200).json({
            success: true,
            message: 'Post deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle upvote on a post
 * @route   POST /api/groups/:groupId/posts/:postId/upvote
 * @access  Private
 */
const toggleUpvote = async (req, res, next) => {
    try {
        const result = await postService.toggleUpvote(
            req.params.postId,
            req.user._id
        );
        res.status(200).json({
            success: true,
            message: result.upvoted ? 'Post upvoted' : 'Upvote removed',
            data: { post: result.post, upvoted: result.upvoted },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle downvote on a post
 * @route   POST /api/groups/:groupId/posts/:postId/downvote
 * @access  Private
 */
const toggleDownvote = async (req, res, next) => {
    try {
        const result = await postService.toggleDownvote(
            req.params.postId,
            req.user._id
        );
        res.status(200).json({
            success: true,
            message: result.downvoted ? 'Post downvoted' : 'Downvote removed',
            data: { post: result.post, downvoted: result.downvoted },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add a comment to a post
 * @route   POST /api/groups/:groupId/posts/:postId/comments
 * @access  Private
 */
const addComment = async (req, res, next) => {
    try {
        const comment = await postService.addComment(
            req.params.postId,
            req.user._id,
            req.body.content
        );
        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: { comment },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get paginated comments for a post
 * @route   GET /api/groups/:groupId/posts/:postId/comments
 * @access  Private
 */
const getComments = async (req, res, next) => {
    try {
        const result = await postService.getComments(
            req.params.postId,
            req.query
        );
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
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
};
