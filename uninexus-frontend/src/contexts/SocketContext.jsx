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
    const [socket, setSocket] = useState(null);
    const [activeChatGroupId, setActiveChatGroupId] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setConnected(false);
            }
            setSocket(null);
            setActiveChatGroupId(null);
            setNotifications([]);
            setUnreadCount(0);
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
        setSocket(socket);

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

        // Heartbeat response
        socket.on('ping', () => {
            socket.emit('pong');
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
            setSocket(null);
        };
    }, [isAuthenticated]);

    useEffect(() => {
        if (!socket || !isAuthenticated) return;

        const handleNewChatGroupMessage = (msg) => {
            const senderId = typeof msg?.sender === 'string' ? msg.sender : msg?.sender?._id;
            if (!msg?.chatGroup) return;

            // Ignore my own messages
            if (senderId && user?._id && senderId === user._id) return;

            // If user is currently viewing that chat group, don't treat it as a notification
            const msgChatGroupId = typeof msg.chatGroup === 'string' ? msg.chatGroup : msg.chatGroup?._id;
            if (activeChatGroupId && msgChatGroupId === activeChatGroupId) return;

            const senderName =
                typeof msg?.sender === 'string'
                    ? 'User'
                    : msg?.sender?.name || msg?.sender?.fullName || 'User';

            const item = {
                id: msg?._id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                type: 'chat',
                chatGroupId: msgChatGroupId,
                senderId: senderId || null,
                senderName,
                content: msg?.content || '',
                createdAt: msg?.createdAt || new Date().toISOString(),
            };

            setNotifications((prev) => [item, ...prev].slice(0, 25));
            setUnreadCount((c) => c + 1);
        };

        socket.on('newChatGroupMessage', handleNewChatGroupMessage);

        return () => {
            socket.off('newChatGroupMessage', handleNewChatGroupMessage);
        };
    }, [activeChatGroupId, isAuthenticated, socket, user?._id]);

    const joinRoom = useCallback((groupId) => {
        socket?.emit('joinRoom', groupId);
    }, [socket]);

    const leaveRoom = useCallback((groupId) => {
        socket?.emit('leaveRoom', groupId);
    }, [socket]);

    const sendMessage = useCallback((groupId, content) => {
        socket?.emit('sendMessage', { groupId, content });
    }, [socket]);

    const joinChatGroup = useCallback((chatGroupId) => {
        socket?.emit('joinChatGroup', chatGroupId);
    }, [socket]);

    const leaveChatGroup = useCallback((chatGroupId) => {
        socket?.emit('leaveChatGroup', chatGroupId);
    }, [socket]);

    const sendChatGroupMessage = useCallback((chatGroupId, content) => {
        socket?.emit('sendChatGroupMessage', { chatGroupId, content });
    }, [socket]);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    const markAllNotificationsRead = useCallback(() => {
        setUnreadCount(0);
    }, []);

    const clearChatNotifications = useCallback((chatGroupId) => {
        if (!chatGroupId) return;
        setNotifications((prev) => prev.filter((n) => n.chatGroupId !== chatGroupId));
        // We don't have per-item read tracking yet; safest is to zero unread when user opens a chat.
        setUnreadCount(0);
    }, []);

    const emitTyping = useCallback((groupId) => {
        socket?.emit('typing', { groupId });
    }, [socket]);

    const emitStopTyping = useCallback((groupId) => {
        socket?.emit('stopTyping', { groupId });
    }, [socket]);

    const value = {
        socket,
        connected,
        onlineUsers,
        activeChatGroupId,
        setActiveChatGroupId,
        notifications,
        unreadCount,
        clearNotifications,
        markAllNotificationsRead,
        clearChatNotifications,
        joinRoom,
        leaveRoom,
        sendMessage,
        joinChatGroup,
        leaveChatGroup,
        sendChatGroupMessage,
        emitTyping,
        emitStopTyping,
    };

    return (
        <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
    );
};
