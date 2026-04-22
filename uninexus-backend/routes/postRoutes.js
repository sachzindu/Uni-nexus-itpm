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
    updateComment,
    deleteComment,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
    createPostSchema,
    updatePostSchema,
    addCommentSchema,
} = require('../validators/postValidator');

// All routes require authentication
router.use(protect);

// Upload image for a post
router.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, data: { imageUrl } });
});

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

router.route('/:postId/comments/:commentId')
    .put(validate(addCommentSchema), updateComment)
    .delete(deleteComment);

module.exports = router;
