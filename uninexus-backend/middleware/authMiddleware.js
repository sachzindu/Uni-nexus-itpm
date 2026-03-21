const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const User = require('../models/User');

/**
 * Authenticate requests using JWT from Bearer token or HTTP-only cookie.
 * Attaches the decoded user object to `req.user`.
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Check Authorization header first
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Fallback to HTTP-only cookie
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            throw createError(401, 'Not authorized. No token provided.');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request (excluding password)
        const user = await User.findById(decoded.id);
        if (!user) {
            throw createError(401, 'User belonging to this token no longer exists.');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(createError(401, 'Invalid token.'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(createError(401, 'Token has expired.'));
        }
        next(error);
    }
};

/**
 * Restrict access to admin users only.
 * Must be used after the `protect` middleware.
 */
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return next(createError(403, 'Access denied. Admin privileges required.'));
};

module.exports = { protect, adminOnly };
