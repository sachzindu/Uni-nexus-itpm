const groupService = require('../services/groupService');

/**
 * @desc    Create a new group
 * @route   POST /api/groups
 * @access  Private
 */
const createGroup = async (req, res, next) => {
    try {
        const group = await groupService.createGroup(req.user._id, req.body);
        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            data: { group },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all groups
 * @route   GET /api/groups
 * @access  Private
 */
const getGroups = async (req, res, next) => {
    try {
        const result = await groupService.getGroups(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single group
 * @route   GET /api/groups/:id
 * @access  Private
 */
const getGroupById = async (req, res, next) => {
    try {
        const group = await groupService.getGroupById(req.params.id);
        res.status(200).json({ success: true, data: { group } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a group
 * @route   PUT /api/groups/:id
 * @access  Private (Group Admin)
 */
const updateGroup = async (req, res, next) => {
    try {
        const group = await groupService.updateGroup(
            req.params.id,
            req.user._id,
            req.body
        );
        res.status(200).json({
            success: true,
            message: 'Group updated successfully',
            data: { group },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a group
 * @route   DELETE /api/groups/:id
 * @access  Private (Group Admin or Platform Admin)
 */
const deleteGroup = async (req, res, next) => {
    try {
        await groupService.deleteGroup(req.params.id, req.user._id, req.user.role);
        res.status(200).json({
            success: true,
            message: 'Group deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Request to join a group
 * @route   POST /api/groups/:id/join
 * @access  Private
 */
const requestJoin = async (req, res, next) => {
    try { 
        const group = await groupService.requestJoin(req.params.id, req.user._id);
        res.status(200).json({
            success: true,
            message: 'Join request sent successfully',
            data: { group },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Approve or reject a join request
 * @route   PUT /api/groups/:id/join-requests/:requestId
 * @access  Private (Group Admin)
 */
const handleJoinRequest = async (req, res, next) => {
    try {
        const group = await groupService.handleJoinRequest(
            req.params.id,
            req.params.requestId,
            req.user._id,
            req.body.status
        );
        res.status(200).json({
            success: true,
            message: `Join request ${req.body.status}`,
            data: { group },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Leave a group
 * @route   POST /api/groups/:id/leave
 * @access  Private
 */
const leaveGroup = async (req, res, next) => {
    try {
        const group = await groupService.leaveGroup(req.params.id, req.user._id);
        res.status(200).json({
            success: true,
            message: 'Left the group successfully',
            data: { group },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get group members
 * @route   GET /api/groups/:id/members
 * @access  Private
 */
const getMembers = async (req, res, next) => {
    try {
        const members = await groupService.getMembers(req.params.id);
        res.status(200).json({ success: true, data: { members } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove a member from a group (admin only)
 * @route   DELETE /api/groups/:groupId/members/:memberId
 * @access  Private (Group Admin)
 */
const removeMember = async (req, res, next) => {
    try {
        const group = await groupService.removeMember(
            req.params.groupId,
            req.params.memberId,
            req.user._id
        );
        res.status(200).json({
            success: true,
            message: 'Member removed successfully',
            data: { group },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    requestJoin,
    handleJoinRequest,
    leaveGroup,
    getMembers,
    removeMember,
};
