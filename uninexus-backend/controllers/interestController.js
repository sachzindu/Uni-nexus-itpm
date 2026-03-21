const interestService = require('../services/interestService');

/**
 * @desc    Create a new interest category
 * @route   POST /api/interests
 * @access  Private (Admin)
 */
const createInterest = async (req, res, next) => {
    try {
        const interest = await interestService.createInterest(req.body);
        res.status(201).json({
            success: true,
            message: 'Interest category created successfully',
            data: { interest },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all interest categories
 * @route   GET /api/interests
 * @access  Private
 */
const getAllInterests = async (req, res, next) => {
    try {
        const interests = await interestService.getAllInterests();
        res.status(200).json({ success: true, data: { interests } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single interest category by ID
 * @route   GET /api/interests/:id
 * @access  Private
 */
const getInterestById = async (req, res, next) => {
    try {
        const interest = await interestService.getInterestById(req.params.id);
        res.status(200).json({ success: true, data: { interest } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get sub-interests for a specific category
 * @route   GET /api/interests/category/:category
 * @access  Private
 */
const getSubInterestsByCategory = async (req, res, next) => {
    try {
        const interest = await interestService.getSubInterestsByCategory(
            req.params.category
        );
        res.status(200).json({
            success: true,
            data: {
                category: interest.category,
                subInterests: interest.subInterests,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update an interest category
 * @route   PUT /api/interests/:id
 * @access  Private (Admin)
 */
const updateInterest = async (req, res, next) => {
    try {
        const interest = await interestService.updateInterest(
            req.params.id,
            req.body
        );
        res.status(200).json({
            success: true,
            message: 'Interest category updated successfully',
            data: { interest },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete an interest category
 * @route   DELETE /api/interests/:id
 * @access  Private (Admin)
 */
const deleteInterest = async (req, res, next) => {
    try {
        await interestService.deleteInterest(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Interest category deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createInterest,
    getAllInterests,
    getInterestById,
    getSubInterestsByCategory,
    updateInterest,
    deleteInterest,
};
