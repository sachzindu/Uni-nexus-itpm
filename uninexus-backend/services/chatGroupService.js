const createError = require('http-errors');
const ChatGroup = require('../models/ChatGroup');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Create a new chat group or 1-on-1 DM.
 * For DMs, checks if a DM between the two users already exists.
 */
const createChatGroup = async (userId, data) => {
    const { name, isDirectMessage, memberIds, avatar } = data;

    // Include the creator in the member list
    const allMemberIds = [...new Set([userId.toString(), ...memberIds])];

    // Validate all member IDs exist
    const existingUsers = await User.find({ _id: { $in: allMemberIds } });
    if (existingUsers.length !== allMemberIds.length) {
        throw createError(400, 'One or more member IDs are invalid.');
    }

    // For DMs, enforce exactly 2 members and check for existing DM
    if (isDirectMessage) {
        if (allMemberIds.length !== 2) {
            throw createError(400, 'Direct messages must have exactly 2 members.');
        }

        // Check for existing DM between these two users
        const existingDM = await ChatGroup.findOne({
            isDirectMessage: true,
            members: { $all: allMemberIds, $size: 2 },
        });

        if (existingDM) {
            // Return existing DM instead of creating a new one
            await existingDM.populate('members', 'name email avatar');
            return existingDM;
        }
    }

    const chatGroup = await ChatGroup.create({
        name: name || '',
        isDirectMessage: isDirectMessage || false,
        creator: userId,
        members: allMemberIds,
        admins: [userId],
        avatar: avatar || '',
    });

    await chatGroup.populate('members', 'name email avatar');

    logger.info(`ChatGroup created by user ${userId}, members: ${allMemberIds.length}`);
    return chatGroup;
};

/**
 * Get all chat groups for a user, sorted by most recent message.
 */
const getChatGroupsForUser = async (userId) => {
    const chatGroups = await ChatGroup.find({ members: userId })
        .populate('members', 'name email avatar isOnline')
        .populate('lastMessage')
        .sort({ lastMessageAt: -1, createdAt: -1 });

    return chatGroups;
};

/**
 * Get a single chat group by ID. Only members can view.
 */
const getChatGroupById = async (chatGroupId, userId) => {
    const chatGroup = await ChatGroup.findById(chatGroupId)
        .populate('members', 'name email avatar isOnline lastSeen')
        .populate('admins', 'name email')
        .populate('lastMessage');

    if (!chatGroup) throw createError(404, 'Chat group not found.');

    if (!chatGroup.members.some((m) => m._id.equals(userId))) {
        throw createError(403, 'You are not a member of this chat group.');
    }

    return chatGroup;
};

/**
 * Update a chat group. Only admins can update.
 */
const updateChatGroup = async (chatGroupId, userId, updateData) => {
    const chatGroup = await ChatGroup.findById(chatGroupId);
    if (!chatGroup) throw createError(404, 'Chat group not found.');

    if (chatGroup.isDirectMessage) {
        throw createError(400, 'Cannot update a direct message conversation.');
    }

    if (!chatGroup.admins.some((admin) => admin.equals(userId))) {
        throw createError(403, 'Only chat group admins can update the group.');
    }

    Object.assign(chatGroup, updateData);
    await chatGroup.save();
    await chatGroup.populate('members', 'name email avatar');

    return chatGroup;
};

/**
 * Add members to a chat group. Only admins can add.
 */
const addMembers = async (chatGroupId, userId, memberIds) => {
    const chatGroup = await ChatGroup.findById(chatGroupId);
    if (!chatGroup) throw createError(404, 'Chat group not found.');

    if (chatGroup.isDirectMessage) {
        throw createError(400, 'Cannot add members to a direct message conversation.');
    }

    if (!chatGroup.admins.some((admin) => admin.equals(userId))) {
        throw createError(403, 'Only chat group admins can add members.');
    }

    // Validate member IDs
    const existingUsers = await User.find({ _id: { $in: memberIds } });
    if (existingUsers.length !== memberIds.length) {
        throw createError(400, 'One or more member IDs are invalid.');
    }

    // Add only new members (avoid duplicates)
    for (const memberId of memberIds) {
        if (!chatGroup.members.some((m) => m.equals(memberId))) {
            chatGroup.members.push(memberId);
        }
    }

    await chatGroup.save();
    await chatGroup.populate('members', 'name email avatar');

    logger.info(`Members added to ChatGroup ${chatGroupId} by user ${userId}`);
    return chatGroup;
};

/**
 * Remove a member from a chat group. Only admins can remove.
 */
const removeMember = async (chatGroupId, userId, memberId) => {
    const chatGroup = await ChatGroup.findById(chatGroupId);
    if (!chatGroup) throw createError(404, 'Chat group not found.');

    if (chatGroup.isDirectMessage) {
        throw createError(400, 'Cannot remove members from a direct message conversation.');
    }

    if (!chatGroup.admins.some((admin) => admin.equals(userId))) {
        throw createError(403, 'Only chat group admins can remove members.');
    }

    if (memberId === userId.toString()) {
        throw createError(400, 'Cannot remove yourself. Use the leave endpoint instead.');
    }

    if (!chatGroup.members.some((m) => m.equals(memberId))) {
        throw createError(400, 'User is not a member of this chat group.');
    }

    chatGroup.members = chatGroup.members.filter((m) => !m.equals(memberId));
    chatGroup.admins = chatGroup.admins.filter((a) => !a.equals(memberId));

    await chatGroup.save();
    await chatGroup.populate('members', 'name email avatar');

    logger.info(`Member ${memberId} removed from ChatGroup ${chatGroupId} by user ${userId}`);
    return chatGroup;
};

/**
 * Leave a chat group. Handles admin succession if the last admin leaves.
 */
const leaveChatGroup = async (chatGroupId, userId) => {
    const chatGroup = await ChatGroup.findById(chatGroupId);
    if (!chatGroup) throw createError(404, 'Chat group not found.');

    if (!chatGroup.members.some((m) => m.equals(userId))) {
        throw createError(400, 'You are not a member of this chat group.');
    }

    chatGroup.members = chatGroup.members.filter((m) => !m.equals(userId));

    const wasAdmin = chatGroup.admins.some((a) => a.equals(userId));
    chatGroup.admins = chatGroup.admins.filter((a) => !a.equals(userId));

    // If last admin left but members remain, promote the oldest member
    if (wasAdmin && chatGroup.admins.length === 0 && chatGroup.members.length > 0) {
        chatGroup.admins.push(chatGroup.members[0]);
        logger.info(
            `ChatGroup "${chatGroupId}": promoted member ${chatGroup.members[0]} to admin (last admin left).`
        );
    }

    await chatGroup.save();

    logger.info(`User ${userId} left ChatGroup ${chatGroupId}`);
    return chatGroup;
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
