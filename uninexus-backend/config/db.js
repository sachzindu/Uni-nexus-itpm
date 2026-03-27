const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI (or MONGODB_URI) is required in .env');
    }

    const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
    });

    const dbName = conn.connection.name || 'unknown';
    const host = conn.connection.host || 'unknown-host';
    console.log(`[DB] Connected to MongoDB: ${host} / ${dbName}`);
    return conn;
};

mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
});

module.exports = connectDB;
