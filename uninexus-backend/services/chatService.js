const createError = require('http-errors');
const Message = require('../models/Message');
const Group = require('../models/Group');
const ChatGroup = require('../models/ChatGroup');

/**
 * Save a message to the database (for interest-based groups).
 * @param {object} messageData - { sender, group, content, type }
 * @returns {Promise<object>} Saved message document
 */
const saveMessage = async (messageData) => {
    const { sender, group, content, type = 'text' } = messageData;

    // Verify group exists
    const groupDoc = await Group.findById(group);
    if (!groupDoc) throw createError(404, 'Group not found.');

    const message = await Message.create({ sender, group, content, type });

    // Populate sender info before returning
    await message.populate('sender', 'name email avatar');

    return message;
};

/**
 * Save a message to a ChatGroup (messenger-style).
 * Also updates lastMessage and lastMessageAt on the ChatGroup.
 * @param {object} messageData - { sender, chatGroup, content, type }
 * @returns {Promise<object>} Saved message document
 */
const saveChatGroupMessage = async (messageData) => {
    const { sender, chatGroup, content, type = 'text' } = messageData;

    // Verify chat group exists and sender is a member
    const chatGroupDoc = await ChatGroup.findById(chatGroup);
    if (!chatGroupDoc) throw createError(404, 'Chat group not found.');

    if (!chatGroupDoc.members.some((m) => m.equals(sender))) {
        throw createError(403, 'You are not a member of this chat group.');
    }

    const message = await Message.create({ sender, chatGroup, content, type });

    // Update lastMessage denormalization for chat list ordering
    chatGroupDoc.lastMessage = message._id;
    chatGroupDoc.lastMessageAt = message.createdAt;
    await chatGroupDoc.save();

    // Populate sender info before returning
    await message.populate('sender', 'name email avatar');

    return message;
};

/**
 * Get paginated messages for an interest-based group (cursor-based pagination).
 * @param {string} groupId - Group ObjectId
 * @param {object} query - { before (cursor), limit }
 * @returns {Promise<object>} Messages and pagination info
 */
const getMessages = async (groupId, query = {}) => {
    const groupDoc = await Group.findById(groupId);
    if (!groupDoc) throw createError(404, 'Group not found.');

    const limit = parseInt(query.limit, 10) || 50;
    const filter = { group: groupId };

    // Cursor-based: get messages before a certain timestamp
    if (query.before) {
        filter.createdAt = { $lt: new Date(query.before) };
    }

    const messages = await Message.find(filter)
        .populate('sender', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(limit + 1); // Fetch one extra to check if there are more

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;

    return {
        messages: result.reverse(), // Return in chronological order
        hasMore,
        nextCursor: hasMore ? result[0].createdAt.toISOString() : null,
    };
};

/**
 * Get paginated messages for a ChatGroup (cursor-based pagination).
 * @param {string} chatGroupId - ChatGroup ObjectId
 * @param {string} userId - Requesting user's ID (for membership check)
 * @param {object} query - { before (cursor), limit }
 * @returns {Promise<object>} Messages and pagination info
 */
const getChatGroupMessages = async (chatGroupId, userId, query = {}) => {
    const chatGroupDoc = await ChatGroup.findById(chatGroupId);
    if (!chatGroupDoc) throw createError(404, 'Chat group not found.');

    if (!chatGroupDoc.members.some((m) => m.equals(userId))) {
        throw createError(403, 'You are not a member of this chat group.');
    }

    const limit = parseInt(query.limit, 10) || 50;
    const filter = { chatGroup: chatGroupId };

    if (query.before) {
        filter.createdAt = { $lt: new Date(query.before) };
    }

    const messages = await Message.find(filter)
        .populate('sender', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(limit + 1);

    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(0, limit) : messages;

    return {
        messages: result.reverse(),
        hasMore,
        nextCursor: hasMore ? result[0].createdAt.toISOString() : null,
    };
};

module.exports = { saveMessage, saveChatGroupMessage, getMessages, getChatGroupMessages };
