const createError = require('http-errors');
const Group = require('../models/Group');
const logger = require('../utils/logger');

/**
 * Create a new group. Creator becomes the first admin and member.
 * Optional memberIds from groupData are added as initial members.
 */
const createGroup = async (userId, groupData) => {
    const { memberIds, ...rest } = groupData;

    // Build initial members: creator + optional friends
    const initialMembers = [userId];
    if (Array.isArray(memberIds) && memberIds.length > 0) {
        for (const id of memberIds) {
            if (!initialMembers.includes(id.toString())) {
                initialMembers.push(id);
            }
        }
    }

    const group = await Group.create({
        ...rest,
        creator: userId,
        admins: [userId],
        members: initialMembers,
    });

    logger.info(`Group created: ${group.name} by user ${userId}`);
    return group;
};

/**
 * Get all non-archived groups with optional filtering.
 */
const getGroups = async (query = {}) => {
    const filter = { isArchived: false };

    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { description: { $regex: query.search, $options: 'i' } },
        ];
    }

    if (query.tag) {
        filter.tags = { $in: [query.tag.toLowerCase().trim()] };
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
        Group.find(filter)
            .populate('creator', 'name email')
            .populate('admins', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        Group.countDocuments(filter),
    ]);

    return {
        groups,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};

/**
 * Get a single group by ID.
 */
const getGroupById = async (groupId) => {
    const group = await Group.findById(groupId)
        .populate('creator', 'name email')
        .populate('admins', 'name email')
        .populate('members', 'name email avatar interests');

    if (!group) throw createError(404, 'Group not found.');
    if (group.isArchived) throw createError(410, 'This group has been archived.');

    return group;
};

/**
 * Update a group. Only admins can update.
 */
const updateGroup = async (groupId, userId, updateData) => {
    const group = await Group.findById(groupId);
    if (!group) throw createError(404, 'Group not found.');

    if (!group.admins.some((admin) => admin.equals(userId))) {
        throw createError(403, 'Only group admins can update the group.');
    }

    Object.assign(group, updateData);
    await group.save();

    return group;
};

/**
 * Delete a group. Only admins can delete.
 */
const deleteGroup = async (groupId, userId, userRole) => {
    const group = await Group.findById(groupId);
    if (!group) throw createError(404, 'Group not found.');

    const isGroupAdmin = group.admins.some((admin) => admin.equals(userId));
    const isSuperAdmin = userRole === 'admin';

    if (!isGroupAdmin && !isSuperAdmin) {
        throw createError(403, 'Only group admins or platform admins can delete groups.');
    }

    await Group.findByIdAndDelete(groupId);
    logger.info(`Group deleted: ${group.name} by user ${userId}`);
};

/**
 * Request to join a group. Prevents duplicate pending requests.
 */
const requestJoin = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) throw createError(404, 'Group not found.');
    if (group.isArchived) throw createError(410, 'Cannot join an archived group.');

    // Check if already a member
    if (group.members.some((m) => m.equals(userId))) {
        throw createError(409, 'You are already a member of this group.');
    }

    // Check for existing pending request (prevent spam)
    const existingRequest = group.joinRequests.find(
        (req) => req.user.equals(userId) && req.status === 'pending'
    );
    if (existingRequest) {
        throw createError(409, 'You already have a pending join request for this group.');
    }

    group.joinRequests.push({ user: userId });
    await group.save();

    logger.info(`Join request from user ${userId} for group ${group.name}`);
    return group;
};

/**
 * Handle a join request (approve/reject). Only admins.
 */
const handleJoinRequest = async (groupId, requestId, userId, status) => {
    const group = await Group.findById(groupId);
    if (!group) throw createError(404, 'Group not found.');

    if (!group.admins.some((admin) => admin.equals(userId))) {
        throw createError(403, 'Only group admins can handle join requests.');
    }

    const request = group.joinRequests.id(requestId);
    if (!request) throw createError(404, 'Join request not found.');
    if (request.status !== 'pending') {
        throw createError(400, `This request has already been ${request.status}.`);
    }

    request.status = status;

    if (status === 'approved') {
        // Add user to members if not already present
        if (!group.members.some((m) => m.equals(request.user))) {
            group.members.push(request.user);
        }
    }

    await group.save();
    logger.info(`Join request ${requestId} ${status} for group ${group.name}`);

    return group;
};

/**
 * Leave a group. Handles orphaned group scenario:
 * - If last admin leaves: promote the oldest member
 * - If no members remain: archive the group
 */
const leaveGroup = async (groupId, userId) => {
    const group = await Group.findById(groupId);
    if (!group) throw createError(404, 'Group not found.');

    if (!group.members.some((m) => m.equals(userId))) {
        throw createError(400, 'You are not a member of this group.');
    }

    // Remove from members
    group.members = group.members.filter((m) => !m.equals(userId));

    // Remove from admins if applicable
    const wasAdmin = group.admins.some((a) => a.equals(userId));
    group.admins = group.admins.filter((a) => !a.equals(userId));

    // Handle orphaned group scenarios
    if (group.members.length === 0) {
        // No members left — archive the group
        group.isArchived = true;
        logger.info(`Group "${group.name}" archived — no members remaining.`);
    } else if (wasAdmin && group.admins.length === 0) {
        // Last admin left but members remain — promote the oldest member
        const oldestMember = group.members[0]; // First member in array (oldest)
        group.admins.push(oldestMember);
        logger.info(
            `Group "${group.name}": promoted member ${oldestMember} to admin (last admin left).`
        );
    }

    await group.save();
    return group;
};

/**
 * Get members of a group.
 */
const getMembers = async (groupId) => {
    const group = await Group.findById(groupId)
        .populate('members', 'name email avatar department year interests');

    if (!group) throw createError(404, 'Group not found.');
    return group.members;
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
};
