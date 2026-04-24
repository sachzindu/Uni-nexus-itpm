const express = require('express');
const router = express.Router();
const { getMessages, getChatGroupMessages, uploadChatGroupPdf } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { uploadChatPdf } = require('../middleware/chatUpload');

// All routes require authentication
router.use(protect);

// Chat group PDF upload (must be before /:groupId/messages)
router.post(
    '/chat-groups/:chatGroupId/upload',
    uploadChatPdf.single('file'),
    uploadChatGroupPdf
);

// Interest-based group messages
router.get('/:groupId/messages', getMessages);

// Chat group (messenger-style) messages
router.get('/chat-groups/:chatGroupId/messages', getChatGroupMessages);

module.exports = router;
