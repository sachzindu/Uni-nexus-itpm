const friendRequestService = require('../services/friendRequestService');

/**
 * @desc    Send a friend request
 * @route   POST /api/friend-requests
 * @access  Private
 */
const sendRequest = async (req, res, next) => {
    try {
        const request = await friendRequestService.sendRequest(
            req.user._id,
            req.body.toUserId
        );
        res.status(201).json({
            success: true,
            message: 'Friend request sent successfully.',
            data: { request },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all pending friend requests received by the current user
 * @route   GET /api/friend-requests/received
 * @access  Private
 */
const getReceivedRequests = async (req, res, next) => {
    try {
        const requests = await friendRequestService.getReceivedRequests(req.user._id);
        res.status(200).json({
            success: true,
            data: { requests },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Respond to a friend request (accept/reject)
 * @route   PUT /api/friend-requests/:id
 * @access  Private
 */
const respondToRequest = async (req, res, next) => {
    try {
        const request = await friendRequestService.respondToRequest(
            req.params.id,
            req.user._id,
            req.body.status
        );
        res.status(200).json({
            success: true,
            message: `Friend request ${req.body.status}.`,
            data: { request },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all accepted friends for the current user
 * @route   GET /api/friend-requests/friends
 * @access  Private
 */
const getFriends = async (req, res, next) => {
    try {
        const friends = await friendRequestService.getFriends(req.user._id);
        res.status(200).json({
            success: true,
            data: { friends },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get friend request status between current user and another user
 * @route   GET /api/friend-requests/status/:userId
 * @access  Private
 */
const getRequestStatus = async (req, res, next) => {
    try {
        const request = await friendRequestService.getRequestStatus(
            req.user._id,
            req.params.userId
        );
        res.status(200).json({
            success: true,
            data: { request },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { sendRequest, getReceivedRequests, respondToRequest, getRequestStatus, getFriends };
