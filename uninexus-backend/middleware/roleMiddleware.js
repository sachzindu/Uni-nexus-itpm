const createError = require('http-errors');

/**
 * Higher-order middleware to restrict access based on user roles.
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'student')
 * @returns {Function} Express middleware
 */
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(
                createError(401, 'Not authorized. Please log in first.')
            );
        }

        if (!roles.includes(req.user.role)) {
            return next(
                createError(
                    403,
                    `Role '${req.user.role}' is not authorized to access this resource.`
                )
            );
        }

        next();
    };
};

module.exports = { checkRole };
