const userService = require('../services/userService');

/**
 * @desc    Get current user's profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await userService.getProfile(req.user._id);
        res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
    try {
        const user = await userService.updateProfile(req.user._id, req.body);
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all users (with search/filter/pagination)
 * @route   GET /api/users
 * @access  Private
 */
const getAllUsers = async (req, res, next) => {
    try {
        const result = await userService.getAllUsers(req.query, req.user._id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user recommendations based on interests
 * @route   GET /api/users/recommendations
 * @access  Private
 */
const getRecommendations = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 10;
        const recommendations = await userService.getRecommendations(req.user._id, limit);
        res.status(200).json({ success: true, data: recommendations });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/users/admin/stats
 * @access  Private (Admin)
 */
const getAdminStats = async (req, res, next) => {
    try {
        const stats = await userService.getAdminStats();
        res.status(200).json({ success: true, data: { stats } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a user's public profile by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProfile, updateProfile, getAllUsers, getRecommendations, getAdminStats, getUserById };
