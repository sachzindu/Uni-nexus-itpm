const express = require('express');
const router = express.Router();
const {
    createInterest,
    getAllInterests,
    getInterestById,
    getSubInterestsByCategory,
    updateInterest,
    deleteInterest,
} = require('../controllers/interestController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
    createInterestSchema,
    updateInterestSchema,
} = require('../validators/interestValidator');

// All routes require authentication
router.use(protect);

// Public (authenticated) read routes
router.get('/', getAllInterests);
router.get('/category/:category', getSubInterestsByCategory);
router.get('/:id', getInterestById);

// Admin-only write routes
router.post('/', adminOnly, validate(createInterestSchema), createInterest);
router.put('/:id', adminOnly, validate(updateInterestSchema), updateInterest);
router.delete('/:id', adminOnly, deleteInterest);

module.exports = router;
