const createError = require('http-errors');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

/**
 * Send a friend request from one user to another.
 * @param {string} fromId - Sender user ID
 * @param {string} toId - Recipient user ID
 * @returns {Promise<object>} Created friend request
 */
const sendRequest = async (fromId, toId) => {
    // Prevent self-requests
    if (fromId.toString() === toId.toString()) {
        throw createError(400, 'You cannot send a friend request to yourself.');
    }

    // Verify recipient exists
    const recipient = await User.findById(toId);
    if (!recipient) {
        throw createError(404, 'Recipient user not found.');
    }

    // Check for existing request in either direction
    const existing = await FriendRequest.findOne({
        $or: [
            { from: fromId, to: toId },
            { from: toId, to: fromId },
        ],
    });

    if (existing) {
        if (existing.status === 'pending') {
            throw createError(409, 'A friend request already exists between you and this user.');
        }
        if (existing.status === 'accepted') {
            throw createError(409, 'You are already friends with this user.');
        }
        // If rejected, allow re-sending by updating the existing record
        if (existing.status === 'rejected') {
            existing.from = fromId;
            existing.to = toId;
            existing.status = 'pending';
            await existing.save();
            return existing;
        }
    }

    const request = await FriendRequest.create({ from: fromId, to: toId });
    return request;
};

/**
 * Get all pending friend requests received by a user.
 * @param {string} userId
 * @returns {Promise<object[]>} Array of friend requests with sender info
 */
const getReceivedRequests = async (userId) => {
    const requests = await FriendRequest.find({
        to: userId,
        status: 'pending',
    })
        .populate('from', 'name email department year profilePhotoUrl interests bio')
        .sort({ createdAt: -1 });

    return requests;
};

/**
 * Accept or reject a friend request.
 * @param {string} requestId - Friend request ID
 * @param {string} userId - Current user ID (must be the recipient)
 * @param {string} status - 'accepted' or 'rejected'
 * @returns {Promise<object>} Updated friend request
 */
const respondToRequest = async (requestId, userId, status) => {
    const request = await FriendRequest.findById(requestId);

    if (!request) {
        throw createError(404, 'Friend request not found.');
    }

    if (request.to.toString() !== userId.toString()) {
        throw createError(403, 'You can only respond to requests sent to you.');
    }

    if (request.status !== 'pending') {
        throw createError(400, 'This request has already been responded to.');
    }

    request.status = status;
    await request.save();

    return request;
};

/**
 * Get the friend request status between two users (if any).
 * @param {string} userId1
 * @param {string} userId2
 * @returns {Promise<object|null>} Friend request or null
 */
const getRequestStatus = async (userId1, userId2) => {
    const request = await FriendRequest.findOne({
        $or: [
            { from: userId1, to: userId2 },
            { from: userId2, to: userId1 },
        ],
    });

    return request;
};

/**
 * Get all accepted friends for a user.
 * Returns the other user's profile info for each accepted request.
 * @param {string} userId
 * @returns {Promise<object[]>} Array of friend user objects
 */
const getFriends = async (userId) => {
    const requests = await FriendRequest.find({
        status: 'accepted',
        $or: [{ from: userId }, { to: userId }],
    })
        .populate('from', 'name email department year profilePhotoUrl bio interests')
        .populate('to', 'name email department year profilePhotoUrl bio interests');

    // Extract the "other" user from each request
    const friends = requests.map((req) => {
        const isFromMe = req.from._id.toString() === userId.toString();
        return isFromMe ? req.to : req.from;
    });

    return friends;
};

module.exports = { sendRequest, getReceivedRequests, respondToRequest, getRequestStatus, getFriends };
