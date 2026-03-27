const User = require('../models/User');
const Group = require('../models/Group');
const Event = require('../models/Event');
const FriendRequest = require('../models/FriendRequest');
const logger = require('./logger');

/**
 * Get IDs of all accepted friends for a user.
 * @param {string} userId
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
const getFriendIds = async (userId) => {
    const requests = await FriendRequest.find({
        status: 'accepted',
        $or: [{ from: userId }, { to: userId }],
    }).lean();
    return requests.map((r) =>
        r.from.toString() === userId.toString() ? r.to : r.from
    );
};

/**
 * Calculate Jaccard Similarity between two sets.
 * Formula: |A ∩ B| / |A ∪ B|
 * @param {string[]} setA - First array of interest tags
 * @param {string[]} setB - Second array of interest tags
 * @returns {number} Similarity score between 0 and 1
 */
const jaccardSimilarity = (setA, setB) => {
    const a = new Set(setA.map((s) => s.toLowerCase().trim()));
    const b = new Set(setB.map((s) => s.toLowerCase().trim()));

    if (a.size === 0 && b.size === 0) return 0;

    const intersection = new Set([...a].filter((x) => b.has(x)));
    const union = new Set([...a, ...b]);

    return intersection.size / union.size;
};

/**
 * Get recommended users for a given user based on Jaccard Similarity of interests.
 * Handles cold start by returning popular groups/events when user has no interests.
 * @param {string} userId - The current user's ObjectId
 * @param {number} [limit=10] - Maximum number of recommendations
 * @returns {Promise<object>} Recommended users or popular content (cold start)
 */
const getRecommendedUsers = async (userId, limit = 10) => {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
        throw new Error('User not found');
    }

    // Cold Start: user has no interests selected
    if (!currentUser.interests || currentUser.interests.length === 0) {
        logger.info(`Cold start for user ${userId} - returning popular content`);
        return getColdStartRecommendations(limit);
    }

    // Exclude accepted friends from recommendations
    const friendIds = await getFriendIds(userId);

    // Get all other users with at least one interest (excluding friends)
    const otherUsers = await User.find({
        _id: { $ne: userId, $nin: friendIds },
        interests: { $exists: true, $not: { $size: 0 } },
    }).select('name email department year bio interests profilePhotoUrl');

    // Calculate similarity scores
    const scoredUsers = otherUsers
        .map((user) => ({
            user,
            similarity: jaccardSimilarity(currentUser.interests, user.interests),
        }))
        .filter((item) => item.similarity > 0) // Only include users with some overlap
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    return {
        type: 'users',
        recommendations: scoredUsers.map((item) => ({
            ...item.user.toObject(),
            similarityScore: Math.round(item.similarity * 100) / 100,
        })),
    };
};

/**
 * Cold start fallback: return most popular groups and events.
 * @param {number} limit - Max items to return
 * @returns {Promise<object>} Popular groups and events
 */
const getColdStartRecommendations = async (limit) => {
    // Get groups sorted by member count (most popular first)
    const popularGroups = await Group.find({ isArchived: false })
        .sort({ members: -1 })
        .limit(limit)
        .select('name description tags members')
        .lean();

    // Sort in-memory by actual member count (since sorting by array field)
    popularGroups.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));

    // Get upcoming events sorted by attendee count
    const popularEvents = await Event.find({
        eventDate: { $gte: new Date() },
        status: { $in: ['upcoming', 'ongoing'] },
    })
        .sort({ attendees: -1 })
        .limit(limit)
        .select('title description eventDate location tags attendees')
        .lean();

    popularEvents.sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0));

    return {
        type: 'coldStart',
        message: 'Add interests to your profile to get personalized recommendations!',
        popularGroups: popularGroups.slice(0, limit),
        popularEvents: popularEvents.slice(0, limit),
    };
};

module.exports = { jaccardSimilarity, getRecommendedUsers, getColdStartRecommendations };
