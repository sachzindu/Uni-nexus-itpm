const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const User = require('../models/User');
const Group = require('../models/Group');
const logger = require('../utils/logger');

/**
 * Generate a JWT token for a user.
 * @param {string} userId - User's ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Register a new user.
 * @param {object} userData - User registration data
 * @returns {Promise<{user: object, token: string}>}
 */
const signup = async (userData) => {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw createError(409, 'A user with this email already exists.');
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    logger.info(`New user registered: ${user.email}`);
    return { user, token };
};

/**
 * Authenticate an existing user.
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<{user: object, token: string}>}
 */
const login = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw createError(401, 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw createError(401, 'Invalid email or password.');
    }

    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.email}`);
    return { user, token };
};

/**
 * Get user by ID.
 * @param {string} userId - User ObjectId
 * @returns {Promise<object>} User document
 */
const getUserById = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw createError(404, 'User not found.');
    }

    // Populate the groups array from the Group collection since it is
    // tracked on the Group model (Group.members) rather than on User.groups.
    const userGroups = await Group.find(
        { members: userId, isArchived: false },
        '_id'
    ).lean();
    const userObj = user.toJSON();
    userObj.groups = userGroups.map((g) => g._id);

    return userObj;
};

module.exports = { signup, login, getUserById, generateToken };
