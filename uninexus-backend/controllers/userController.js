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

/**
 * @desc    Upload profile photo
 * @route   POST /api/users/profile/photo
 * @access  Private
 */
const uploadProfilePhoto = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided. Please upload a JPEG, PNG, or WebP image.',
            });
        }

        const user = await userService.updateProfilePhoto(req.user._id, req.file.filename);
        res.status(200).json({
            success: true,
            message: 'Profile photo updated successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload gallery photos (up to 5 total)
 * @route   POST /api/users/profile/gallery
 * @access  Private
 */
const uploadGalleryPhotos = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided.',
            });
        }

        const user = await userService.uploadGalleryPhotos(req.user._id, req.files);
        res.status(200).json({
            success: true,
            message: 'Gallery photos uploaded successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a single gallery photo
 * @route   DELETE /api/users/profile/gallery
 * @access  Private
 */
const deleteGalleryPhoto = async (req, res, next) => {
    try {
        const { photoUrl } = req.body;
        if (!photoUrl) {
            return res.status(400).json({
                success: false,
                message: 'photoUrl is required.',
            });
        }

        const user = await userService.deleteGalleryPhoto(req.user._id, photoUrl);
        res.status(200).json({
            success: true,
            message: 'Photo deleted successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get groups the current user is a member of
 * @route   GET /api/users/my-groups
 * @access  Private
 */
const getMyGroups = async (req, res, next) => {
    try {
        const groups = await userService.getMyGroups(req.user._id);
        res.status(200).json({ success: true, data: { groups } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get events the current user is registered for
 * @route   GET /api/users/my-events
 * @access  Private
 */
const getMyEvents = async (req, res, next) => {
    try {
        const events = await userService.getMyEvents(req.user._id);
        res.status(200).json({ success: true, data: { events } });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProfile, updateProfile, getAllUsers, getRecommendations, getAdminStats, getUserById, uploadProfilePhoto, uploadGalleryPhotos, deleteGalleryPhoto, getMyGroups, getMyEvents };
