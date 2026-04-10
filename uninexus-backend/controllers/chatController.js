const chatService = require('../services/chatService');

/**
 * @desc    Upload a PDF to a chat group (creates a file message + broadcasts via socket)
 * @route   POST /api/chat/chat-groups/:chatGroupId/upload
 * @access  Private (Member only)
 */
const uploadChatGroupPdf = async (req, res, next) => {
    try {
        const { chatGroupId } = req.params;
        if (!req.file) {
            res.status(400).json({ success: false, message: 'PDF file is required.' });
            return;
        }

        const publicPath = `/uploads/chat/${req.file.filename}`;
        const message = await chatService.saveChatGroupMessage({
            sender: req.user._id,
            chatGroup: chatGroupId,
            content: req.file.originalname || 'PDF',
            type: 'file',
            fileUrl: publicPath,
            fileName: req.file.originalname,
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`chatgroup:${chatGroupId}`).emit('newChatGroupMessage', {
                _id: message._id,
                sender: message.sender,
                chatGroup: message.chatGroup,
                content: message.content,
                type: message.type,
                fileUrl: message.fileUrl,
                fileName: message.fileName,
                createdAt: message.createdAt,
            });
        }

        res.status(201).json({ success: true, data: { message } });
    } catch (error) {
        next(error);
    }
};

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

module.exports = { getMessages, getChatGroupMessages, uploadChatGroupPdf };
