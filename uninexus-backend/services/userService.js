const createError = require('http-errors');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Group = require('../models/Group');
const Event = require('../models/Event');
const FriendRequest = require('../models/FriendRequest');
const { getRecommendedUsers } = require('../utils/recommendationEngine');

/**
 * Get a user's profile by ID.
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getProfile = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw createError(404, 'User not found.');
    }
    return user;
};

/**
 * Update a user's profile. Normalizes interest tags.
 * @param {string} userId
 * @param {object} updateData
 * @returns {Promise<object>} Updated user
 */
const updateProfile = async (userId, updateData) => {
    const user = await User.findById(userId);
    if (!user) {
        throw createError(404, 'User not found.');
    }

    // Normalize flat interests if provided directly
    if (updateData.interests) {
        updateData.interests = [
            ...new Set(updateData.interests.map((i) => i.toLowerCase().trim())),
        ];
    }

    // Use user.set() instead of Object.assign so that Mongoose's
    // change tracking detects modifications (enables isModified()
    // in pre-save hooks, e.g. the selectedInterests → interests sync)
    user.set(updateData);

    // Explicitly mark selectedInterests as modified so Mongoose
    // detects the change on this nested subdocument array
    if (updateData.selectedInterests) {
        user.markModified('selectedInterests');
    }

    await user.save();

    return user;
};

/**
 * Get all users with optional filtering.
 * @param {object} query - Query parameters (search, department, year)
 * @returns {Promise<object[]>} Array of users
 */
const getAllUsers = async (query = {}, userId = null) => {
    const filter = {};

    // Exclude current user and their accepted friends from results
    if (userId) {
        const friendRequests = await FriendRequest.find({
            status: 'accepted',
            $or: [{ from: userId }, { to: userId }],
        }).lean();
        const friendIds = friendRequests.map((r) =>
            r.from.toString() === userId.toString() ? r.to : r.from
        );
        filter._id = { $nin: [userId, ...friendIds] };
    }

    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ];
    }

    if (query.department) {
        filter.department = { $regex: query.department, $options: 'i' };
    }

    if (query.year) {
        filter.year = parseInt(query.year, 10);
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        User.countDocuments(filter),
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Get recommendations for a user.
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<object>}
 */
const getRecommendations = async (userId, limit) => {
    return getRecommendedUsers(userId, limit);
};

/**
 * Get admin dashboard statistics.
 * @returns {Promise<object>} Stats object with user count
 */
const getAdminStats = async () => {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    return {
        totalUsers,
        totalStudents,
        totalAdmins,
    };
};

/**
 * Get a user's public profile by ID.
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw createError(404, 'User not found.');
    }
    return user;
};

/**
 * Update a user's profile photo.
 * Saves the new photo URL and removes the old file from disk if present.
 * @param {string} userId
 * @param {string} filename - The uploaded file's name on disk
 * @returns {Promise<object>} Updated user
 */
const updateProfilePhoto = async (userId, filename) => {
    const user = await User.findById(userId);
    if (!user) {
        throw createError(404, 'User not found.');
    }

    // Delete old photo file from disk if it exists
    if (user.profilePhotoUrl) {
        const oldFilePath = path.join(__dirname, '..', user.profilePhotoUrl);
        if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
        }
    }

    user.profilePhotoUrl = `/uploads/profile-photos/${filename}`;
    await user.save();

    return user;
};

/**
 * Upload gallery photos for a user (max 5 total).
 * @param {string} userId
 * @param {object[]} files - Array of multer file objects
 * @returns {Promise<object>} Updated user
 */
const uploadGalleryPhotos = async (userId, files) => {
    const user = await User.findById(userId);
    if (!user) {
        throw createError(404, 'User not found.');
    }

    const currentCount = user.galleryPhotos?.length || 0;
    if (currentCount + files.length > 5) {
        // Clean up uploaded files since we're rejecting
        files.forEach((f) => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        });
        throw createError(400, `You can upload at most ${5 - currentCount} more photo(s). Maximum is 5.`);
    }

    const newPaths = files.map((f) => `/uploads/gallery/${userId}/${f.filename}`);
    user.galleryPhotos.push(...newPaths);
    await user.save();

    return user;
};

/**
 * Delete a single gallery photo for a user.
 * @param {string} userId
 * @param {string} photoUrl - The URL path of the photo to delete
 * @returns {Promise<object>} Updated user
 */
const deleteGalleryPhoto = async (userId, photoUrl) => {
    const user = await User.findById(userId);
    if (!user) {
        throw createError(404, 'User not found.');
    }

    const idx = user.galleryPhotos.indexOf(photoUrl);
    if (idx === -1) {
        throw createError(404, 'Photo not found in your gallery.');
    }

    // Remove from array
    user.galleryPhotos.splice(idx, 1);
    await user.save();

    // Delete file from disk
    const filePath = path.join(__dirname, '..', photoUrl);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    return user;
};

/**
 * Get all groups the current user is a member of.
 * @param {string} userId
 * @returns {Promise<object[]>} Array of groups
 */
const getMyGroups = async (userId) => {
    const groups = await Group.find({
        members: userId,
        isArchived: false,
    })
        .populate('creator', 'name email')
        .populate('admins', 'name email')
        .sort({ createdAt: -1 });

    return groups;
};

/**
 * Get all events the current user is registered for.
 * @param {string} userId
 * @returns {Promise<object[]>} Array of events
 */
const getMyEvents = async (userId) => {
    const events = await Event.find({
        attendees: userId,
    })
        .populate('organizer', 'name email')
        .populate('group', 'name')
        .sort({ eventDate: 1 });

    return events;
};

module.exports = { getProfile, updateProfile, getAllUsers, getRecommendations, getAdminStats, getUserById, updateProfilePhoto, uploadGalleryPhotos, deleteGalleryPhoto, getMyGroups, getMyEvents };
