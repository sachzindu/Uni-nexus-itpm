const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ChatGroup = require('../models/ChatGroup');
const chatService = require('../services/chatService');
const logger = require('./logger');

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 10000;

/**
 * Initialize Socket.io event handlers.
 * @param {import('socket.io').Server} io - Socket.io server instance
 */
const initializeSocket = (io) => {
    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.query?.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.userName = user.name;
            next();
        } catch (error) {
            logger.error('Socket authentication failed', { error: error.message });
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        logger.info(`Socket connected: ${socket.userName} (${userId})`);

        // Track online status
        onlineUsers.set(userId, socket.id);
        updateUserOnlineStatus(userId, true);
        io.emit('userOnline', { userId, userName: socket.userName });

        // Heartbeat mechanism
        let heartbeatTimer = null;

        const startHeartbeat = () => {
            heartbeatTimer = setInterval(() => {
                socket.emit('ping');

                const pongTimeout = setTimeout(() => {
                    logger.warn(`Heartbeat timeout for user ${userId}`);
                    socket.disconnect(true);
                }, HEARTBEAT_TIMEOUT);

                socket.once('pong', () => {
                    clearTimeout(pongTimeout);
                });
            }, HEARTBEAT_INTERVAL);
        };

        startHeartbeat();

        // Join a chat room (group)
        socket.on('joinRoom', (groupId) => {
            socket.join(groupId);
            logger.debug(`${socket.userName} joined room: ${groupId}`);

            // Notify room members
            socket.to(groupId).emit('userJoinedRoom', {
                userId,
                userName: socket.userName,
                groupId,
            });
        });

        // Leave a chat room
        socket.on('leaveRoom', (groupId) => {
            socket.leave(groupId);
            logger.debug(`${socket.userName} left room: ${groupId}`);

            socket.to(groupId).emit('userLeftRoom', {
                userId,
                userName: socket.userName,
                groupId,
            });
        });

        // Send a message — persist BEFORE emitting
        socket.on('sendMessage', async (data) => {
            try {
                const { groupId, content } = data;

                if (!groupId || !content || !content.trim()) {
                    socket.emit('error', { message: 'Group ID and message content are required.' });
                    return;
                }

                // Save to database FIRST (message persistence guarantee)
                const message = await chatService.saveMessage({
                    sender: userId,
                    group: groupId,
                    content: content.trim(),
                });

                // Then emit to the room (including sender for confirmation)
                io.to(groupId).emit('newMessage', {
                    _id: message._id,
                    sender: message.sender,
                    group: message.group,
                    content: message.content,
                    type: message.type,
                    createdAt: message.createdAt,
                });
            } catch (error) {
                logger.error('Error sending message', { error: error.message, userId });
                socket.emit('error', { message: 'Failed to send message.' });
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { groupId } = data;
            socket.to(groupId).emit('userTyping', {
                userId,
                userName: socket.userName,
                groupId,
            });
        });

        // Stop typing indicator
        socket.on('stopTyping', (data) => {
            const { groupId } = data;
            socket.to(groupId).emit('userStopTyping', {
                userId,
                groupId,
            });
        });

        // ─── ChatGroup Socket Events ─────────────────────────────────

        // Join a chat group room
        socket.on('joinChatGroup', (chatGroupId) => {
            socket.join(`chatgroup:${chatGroupId}`);
            logger.debug(`${socket.userName} joined chat group room: ${chatGroupId}`);

            socket.to(`chatgroup:${chatGroupId}`).emit('userJoinedChatGroup', {
                userId,
                userName: socket.userName,
                chatGroupId,
            });
        });

        // Leave a chat group room
        socket.on('leaveChatGroup', (chatGroupId) => {
            socket.leave(`chatgroup:${chatGroupId}`);
            logger.debug(`${socket.userName} left chat group room: ${chatGroupId}`);

            socket.to(`chatgroup:${chatGroupId}`).emit('userLeftChatGroup', {
                userId,
                userName: socket.userName,
                chatGroupId,
            });
        });

        // Send a message in a chat group — persist BEFORE emitting
        socket.on('sendChatGroupMessage', async (data) => {
            try {
                const { chatGroupId, content } = data;

                if (!chatGroupId || !content || !content.trim()) {
                    socket.emit('error', { message: 'Chat group ID and message content are required.' });
                    return;
                }

                // Save to database FIRST (message persistence guarantee)
                const message = await chatService.saveChatGroupMessage({
                    sender: userId,
                    chatGroup: chatGroupId,
                    content: content.trim(),
                });

                // Then emit to the chat group room (including sender)
                io.to(`chatgroup:${chatGroupId}`).emit('newChatGroupMessage', {
                    _id: message._id,
                    sender: message.sender,
                    chatGroup: message.chatGroup,
                    content: message.content,
                    type: message.type,
                    fileUrl: message.fileUrl,
                    fileName: message.fileName,
                    createdAt: message.createdAt,
                });
            } catch (error) {
                logger.error('Error sending chat group message', { error: error.message, userId });
                socket.emit('error', { message: 'Failed to send message.' });
            }
        });

        // Typing indicator for chat groups
        socket.on('chatGroupTyping', (data) => {
            const { chatGroupId } = data;
            socket.to(`chatgroup:${chatGroupId}`).emit('userChatGroupTyping', {
                userId,
                userName: socket.userName,
                chatGroupId,
            });
        });

        // Stop typing indicator for chat groups
        socket.on('chatGroupStopTyping', (data) => {
            const { chatGroupId } = data;
            socket.to(`chatgroup:${chatGroupId}`).emit('userChatGroupStopTyping', {
                userId,
                chatGroupId,
            });
        });

        // Disconnect
        socket.on('disconnect', (reason) => {
            logger.info(`Socket disconnected: ${socket.userName} (${reason})`);

            // Clear heartbeat
            if (heartbeatTimer) {
                clearInterval(heartbeatTimer);
            }

            // Remove from online tracking
            onlineUsers.delete(userId);
            updateUserOnlineStatus(userId, false);

            io.emit('userOffline', { userId, userName: socket.userName });
        });
    });

    logger.info('Socket.io handler initialized');
};

/**
 * Update user's online status and lastSeen in database.
 * @param {string} userId
 * @param {boolean} isOnline
 */
const updateUserOnlineStatus = async (userId, isOnline) => {
    try {
        await User.findByIdAndUpdate(userId, {
            isOnline,
            lastSeen: new Date(),
        });
    } catch (error) {
        logger.error('Failed to update user online status', {
            userId,
            error: error.message,
        });
    }
};

/**
 * Get the list of currently online user IDs.
 * @returns {string[]}
 */
const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};

module.exports = { initializeSocket, getOnlineUsers };
