const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

/**
 * Connect to MongoDB with exponential-backoff retry logic.
 * @param {number} [retryCount=0] - Current retry attempt
 * @returns {Promise<void>}
 */
const connectDB = async (retryCount = 0) => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        logger.info(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
            logger.warn(
                `MongoDB connection failed. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`,
                { error: error.message }
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            return connectDB(retryCount + 1);
        }
        logger.error('MongoDB connection failed after max retries. Exiting.', {
            error: error.message,
        });
        process.exit(1);
    }
};

// Mongoose connection event listeners
mongoose.connection.on('connected', () => {
    logger.info('Mongoose connection established');
});

mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose connection disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('Mongoose connection closed through app termination');
    process.exit(0);
});

module.exports = connectDB;
