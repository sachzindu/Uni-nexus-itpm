import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [activeChatGroupId, setActiveChatGroupId] = useState(null);
    const socketRef = useRef(null);
    const activeChatGroupRef = useRef(null);

    useEffect(() => {
        activeChatGroupRef.current = activeChatGroupId;
    }, [activeChatGroupId]);

    useEffect(() => {
        if (!isAuthenticated) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            setNotifications([]);
            setActiveChatGroupId(null);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('userOnline', ({ userId }) => {
            setOnlineUsers((prev) => {
                if (!prev.includes(userId)) return [...prev, userId];
                return prev;
            });
        });

        socket.on('userOffline', ({ userId }) => {
            setOnlineUsers((prev) => prev.filter((id) => id !== userId));
        });

        socket.on('newChatGroupMessage', (message) => {
            const senderId =
                typeof message?.sender === 'string'
                    ? message.sender
                    : message?.sender?._id;

            // Do not notify for own messages.
            if (!senderId || senderId === user?._id) return;

            // Do not create bell notification while user is inside that exact chat.
            if (activeChatGroupRef.current && message?.chatGroup === activeChatGroupRef.current) return;

            const senderName =
                typeof message?.sender === 'string'
                    ? 'Friend'
                    : message?.sender?.name || 'Friend';

            setNotifications((prev) => [
                {
                    id: message?._id || `${Date.now()}-${Math.random()}`,
                    chatGroupId: message?.chatGroup,
                    senderName,
                    content: message?.content || 'Sent you a new message',
                    createdAt: message?.createdAt || new Date().toISOString(),
                    read: false,
                },
                ...prev,
            ]);
        });

        // Heartbeat response
        socket.on('ping', () => {
            socket.emit('pong');
        });

        return () => {
            socket.off('newChatGroupMessage');
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [isAuthenticated, user?._id]);

    const joinRoom = useCallback((groupId) => {
        socketRef.current?.emit('joinRoom', groupId);
    }, []);

    const leaveRoom = useCallback((groupId) => {
        socketRef.current?.emit('leaveRoom', groupId);
    }, []);

    const sendMessage = useCallback((groupId, content) => {
        socketRef.current?.emit('sendMessage', { groupId, content });
    }, []);

    const joinChatGroup = useCallback((chatGroupId) => {
        socketRef.current?.emit('joinChatGroup', chatGroupId);
    }, []);

    const leaveChatGroup = useCallback((chatGroupId) => {
        socketRef.current?.emit('leaveChatGroup', chatGroupId);
    }, []);

    const sendChatGroupMessage = useCallback((chatGroupId, content) => {
        socketRef.current?.emit('sendChatGroupMessage', { chatGroupId, content });
    }, []);

    const emitTyping = useCallback((groupId) => {
        socketRef.current?.emit('typing', { groupId });
    }, []);

    const emitStopTyping = useCallback((groupId) => {
        socketRef.current?.emit('stopTyping', { groupId });
    }, []);

    const markAllNotificationsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const removeNotification = useCallback((notificationId) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }, []);

    const value = {
        socket: socketRef.current,
        connected,
        onlineUsers,
        joinRoom,
        leaveRoom,
        sendMessage,
        joinChatGroup,
        leaveChatGroup,
        sendChatGroupMessage,
        emitTyping,
        emitStopTyping,
        notifications,
        unreadNotificationCount: notifications.filter((n) => !n.read).length,
        markAllNotificationsRead,
        removeNotification,
        activeChatGroupId,
        setActiveChatGroupId,
    };

    return (
        <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
    );
};
