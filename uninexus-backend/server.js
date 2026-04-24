require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const { initializeSocket } = require('./utils/socketHandler');
const path = require('path');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const eventRoutes = require('./routes/eventRoutes');
const chatRoutes = require('./routes/chatRoutes');
const postRoutes = require('./routes/postRoutes');
const chatGroupRoutes = require('./routes/chatGroupRoutes');
const interestRoutes = require('./routes/interestRoutes');
const friendRequestRoutes = require('./routes/friendRequestRoutes');

const app = express();

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser clients (no origin header) and allowed browser origins.
        if (!origin || clientOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.set('io', io);

// ─── Middleware Stack ─────────────────────────────────────────
app.use(helmet());
app.use(
    helmet({
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                'img-src': ["'self'", 'data:', 'http://localhost:3000', 'https:'],
                'connect-src': ["'self'", 'http://localhost:3000', 'ws://localhost:3000', 'https:'],
            },
        },
    })
);
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─── Static File Serving ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Static File Serving ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups/:groupId/posts', postRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-groups', chatGroupRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/friend-requests', friendRequestRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.originalUrl}`,
    });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: clientOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
    transports: ['websocket', 'polling'],
});

initializeSocket(io);

const startServer = async () => {
    try {
        console.log('[BOOT] Starting server...');
        await connectDB();

        server.listen(PORT, () => {
            console.log(`[BOOT] Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('[BOOT] Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

module.exports = app;
