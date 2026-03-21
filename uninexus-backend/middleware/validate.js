const createError = require('http-errors');

/**
 * Generic Joi validation middleware factory.
 * Validates req.body against the provided Joi schema.
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const message = error.details.map((detail) => detail.message).join('. ');
            return next(createError(400, message));
        }

        // Replace req.body with validated/sanitized value
        req.body = value;
        next();
    };
};

module.exports = { validate };
