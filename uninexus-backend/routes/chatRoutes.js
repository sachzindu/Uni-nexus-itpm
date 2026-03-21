const express = require('express');
const router = express.Router();
const { getMessages, getChatGroupMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Interest-based group messages
router.get('/:groupId/messages', getMessages);

// Chat group (messenger-style) messages
router.get('/chat-groups/:chatGroupId/messages', getChatGroupMessages);

module.exports = router;
