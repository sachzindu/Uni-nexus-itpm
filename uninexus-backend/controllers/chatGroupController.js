const chatGroupService = require('../services/chatGroupService');

/**
 * @desc    Create a new chat group or DM
 * @route   POST /api/chat-groups
 * @access  Private
 */
const createChatGroup = async (req, res, next) => {
    try {
        const chatGroup = await chatGroupService.createChatGroup(
            req.user._id,
            req.body
        );
        res.status(201).json({
            success: true,
            message: 'Chat group created successfully',
            data: { chatGroup },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all chat groups for the current user
 * @route   GET /api/chat-groups
 * @access  Private
 */
const getChatGroupsForUser = async (req, res, next) => {
    try {
        const chatGroups = await chatGroupService.getChatGroupsForUser(req.user._id);
        res.status(200).json({ success: true, data: { chatGroups } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single chat group
 * @route   GET /api/chat-groups/:id
 * @access  Private (Member only)
 */
const getChatGroupById = async (req, res, next) => {
    try {
        const chatGroup = await chatGroupService.getChatGroupById(
            req.params.id,
            req.user._id
        );
        res.status(200).json({ success: true, data: { chatGroup } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a chat group
 * @route   PUT /api/chat-groups/:id
 * @access  Private (Admin only)
 */
const updateChatGroup = async (req, res, next) => {
    try {
        const chatGroup = await chatGroupService.updateChatGroup(
            req.params.id,
            req.user._id,
            req.body
        );
        res.status(200).json({
            success: true,
            message: 'Chat group updated successfully',
            data: { chatGroup },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add members to a chat group
 * @route   POST /api/chat-groups/:id/members
 * @access  Private (Admin only)
 */
const addMembers = async (req, res, next) => {
    try {
        const chatGroup = await chatGroupService.addMembers(
            req.params.id,
            req.user._id,
            req.body.memberIds
        );
        res.status(200).json({
            success: true,
            message: 'Members added successfully',
            data: { chatGroup },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove a member from a chat group
 * @route   DELETE /api/chat-groups/:id/members/:memberId
 * @access  Private (Admin only)
 */
const removeMember = async (req, res, next) => {
    try {
        const chatGroup = await chatGroupService.removeMember(
            req.params.id,
            req.user._id,
            req.params.memberId
        );
        res.status(200).json({
            success: true,
            message: 'Member removed successfully',
            data: { chatGroup },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Leave a chat group
 * @route   POST /api/chat-groups/:id/leave
 * @access  Private
 */
const leaveChatGroup = async (req, res, next) => {
    try {
        const chatGroup = await chatGroupService.leaveChatGroup(
            req.params.id,
            req.user._id
        );
        res.status(200).json({
            success: true,
            message: 'Left chat group successfully',
            data: { chatGroup },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createChatGroup,
    getChatGroupsForUser,
    getChatGroupById,
    updateChatGroup,
    addMembers,
    removeMember,
    leaveChatGroup,
};
