const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getAllUsers,
    getRecommendations,
    getAdminStats,
    getUserById,
    uploadProfilePhoto,
    uploadGalleryPhotos,
    deleteGalleryPhoto,
    getMyGroups,
    getMyEvents,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { updateProfileSchema } = require('../validators/userValidator');
const { uploadProfilePhoto: uploadMiddleware, uploadGalleryPhotos: galleryUploadMiddleware } = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.post('/profile/photo', uploadMiddleware, uploadProfilePhoto);
router.post('/profile/gallery', galleryUploadMiddleware, uploadGalleryPhotos);
router.delete('/profile/gallery', deleteGalleryPhoto);
router.get('/recommendations', getRecommendations);
router.get('/admin/stats', adminOnly, getAdminStats);
router.get('/my-groups', getMyGroups);
router.get('/my-events', getMyEvents);
router.get('/', getAllUsers);
router.get('/:id', getUserById);

module.exports = router;
