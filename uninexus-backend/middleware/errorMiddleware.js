const logger = require('../utils/logger');

/**
 * Global error handling middleware.
 * Catches all errors and returns a standardized JSON response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(err.errors).map((val) => val.message);
        message = messages.join('. ');
    }

    // Mongoose bad ObjectId (CastError)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value for '${field}'. This ${field} already exists.`;
    }

    // Multer (file upload)
    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File is too large. Maximum size is 15 MB.';
        } else {
            message = err.message || 'File upload failed.';
        }
    }

    if (err.message === 'Only PDF files are allowed.') {
        statusCode = 400;
        message = err.message;
    }

    // Log server errors
    if (statusCode >= 500) {
        logger.error(`${statusCode} - ${message}`, {
            path: req.originalUrl,
            method: req.method,
            stack: err.stack,
        });
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = { errorHandler };
