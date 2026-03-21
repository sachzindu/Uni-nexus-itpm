const chatService = require('../services/chatService');

/**
 * @desc    Get messages for an interest-based group (cursor-based pagination)
 * @route   GET /api/chat/:groupId/messages
 * @access  Private
 */
const getMessages = async (req, res, next) => {
    try {
        const result = await chatService.getMessages(req.params.groupId, req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get messages for a chat group (cursor-based pagination)
 * @route   GET /api/chat/chat-groups/:chatGroupId/messages
 * @access  Private (Member only)
 */
const getChatGroupMessages = async (req, res, next) => {
    try {
        const result = await chatService.getChatGroupMessages(
            req.params.chatGroupId,
            req.user._id,
            req.query
        );
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = { getMessages, getChatGroupMessages };
