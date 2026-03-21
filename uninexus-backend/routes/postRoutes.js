const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    createPost,
    getPostsByGroup,
    getPostById,
    updatePost,
    deletePost,
    toggleUpvote,
    toggleDownvote,
    addComment,
    getComments,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
    createPostSchema,
    updatePostSchema,
    addCommentSchema,
} = require('../validators/postValidator');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getPostsByGroup)
    .post(validate(createPostSchema), createPost);

router.route('/:postId')
    .get(getPostById)
    .put(validate(updatePostSchema), updatePost)
    .delete(deletePost);

router.post('/:postId/upvote', toggleUpvote);
router.post('/:postId/downvote', toggleDownvote);

router.route('/:postId/comments')
    .get(getComments)
    .post(validate(addCommentSchema), addComment);

module.exports = router;
