const createError = require('http-errors');
const Interest = require('../models/Interest');
const logger = require('../utils/logger');

/**
 * Create a new interest category with sub-interests.
 * @param {object} data - { category, subInterests }
 * @returns {Promise<object>} Created interest document
 */
const createInterest = async (data) => {
    const interest = await Interest.create(data);
    logger.info(`Interest category created: ${interest.category}`);
    return interest;
};

/**
 * Get all interest categories with their sub-interests.
 * @returns {Promise<object[]>} Array of interest documents
 */
const getAllInterests = async () => {
    const interests = await Interest.find().sort({ category: 1 });
    return interests;
};

/**
 * Get a single interest category by ID.
 * @param {string} interestId
 * @returns {Promise<object>} Interest document
 */
const getInterestById = async (interestId) => {
    const interest = await Interest.findById(interestId);
    if (!interest) throw createError(404, 'Interest category not found.');
    return interest;
};

/**
 * Get sub-interests for a specific category name.
 * Used during onboarding to show available sub-interests for a chosen category.
 * @param {string} category - Category name
 * @returns {Promise<object>} Interest document with sub-interests
 */
const getSubInterestsByCategory = async (category) => {
    const interest = await Interest.findOne({
        category: { $regex: new RegExp(`^${category}$`, 'i') },
    });

    if (!interest) {
        throw createError(404, `Interest category '${category}' not found.`);
    }

    return interest;
};

/**
 * Update an interest category or its sub-interests.
 * @param {string} interestId
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} Updated interest document
 */
const updateInterest = async (interestId, updateData) => {
    const interest = await Interest.findById(interestId);
    if (!interest) throw createError(404, 'Interest category not found.');

    Object.assign(interest, updateData);
    await interest.save();

    logger.info(`Interest category updated: ${interest.category}`);
    return interest;
};

/**
 * Delete an interest category.
 * @param {string} interestId
 */
const deleteInterest = async (interestId) => {
    const interest = await Interest.findById(interestId);
    if (!interest) throw createError(404, 'Interest category not found.');

    await Interest.findByIdAndDelete(interestId);
    logger.info(`Interest category deleted: ${interest.category}`);
};

module.exports = {
    createInterest,
    getAllInterests,
    getInterestById,
    getSubInterestsByCategory,
    updateInterest,
    deleteInterest,
};
