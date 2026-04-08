import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Send, Smile, Search, MessageCircle, Users, Circle, Hash,
    ArrowLeft,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { chatGroupAPI, chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Skeleton } from '../components/ui/Loader';
import { useToast } from '../components/ui/Toast';

const ChatPage = () => {
    const { user } = useAuth();
    const {
        socket,
        onlineUsers,
        joinChatGroup,
        leaveChatGroup,
        sendChatGroupMessage,
        setActiveChatGroupId,
        clearChatNotifications,
    } = useSocket();
    const toast = useToast();

    const [chatGroups, setChatGroups] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const [typingUsers, setTypingUsers] = useState([]);

    const [searchParams, setSearchParams] = useSearchParams();

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch chat groups
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await chatGroupAPI.getAll();
                const loaded = res.data?.chatGroups || res.data || [];
                setChatGroups(loaded);

                // Auto-select chat from query param
                const chatId = searchParams.get('chatId');
                if (chatId && loaded.length > 0) {
                    const target = loaded.find((c) => c._id === chatId);
                    if (target) {
                        selectChat(target);
                        // Clear the query param
                        setSearchParams({}, { replace: true });
                    }
                }
            } catch {
                setChatGroups([]);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, []);

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        const handleSocketError = (payload) => {
            toast.error(payload?.message || 'Failed to send message');
        };

        const handleNewMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
        };

        const handleTyping = ({ userId, userName }) => {
            if (userId !== user?._id) {
                setTypingUsers((prev) => {
                    if (!prev.find((u) => u.userId === userId)) {
                        return [...prev, { userId, userName }];
                    }
                    return prev;
                });
            }
        };

        const handleStopTyping = ({ userId }) => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        };

        socket.on('newChatGroupMessage', handleNewMessage);
        socket.on('userChatGroupTyping', handleTyping);
        socket.on('userChatGroupStopTyping', handleStopTyping);
        socket.on('error', handleSocketError);

        return () => {
            socket.off('newChatGroupMessage', handleNewMessage);
            socket.off('userChatGroupTyping', handleTyping);
            socket.off('userChatGroupStopTyping', handleStopTyping);
            socket.off('error', handleSocketError);
        };
    }, [socket, user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Select a chat
    const selectChat = async (chat) => {
        // Leave previous room
        if (selectedChat) {
            leaveChatGroup(selectedChat._id);
        }

        setSelectedChat(chat);
        setActiveChatGroupId?.(chat._id);
        clearChatNotifications?.(chat._id);
        setShowSidebar(false);
        setMsgLoading(true);
        setMessages([]);
        setTypingUsers([]);

        try {
            const res = await chatAPI.getChatGroupMessages(chat._id);
            // chatAPI returns { success: true, data: { messages: [...], hasMore, nextCursor } }
            setMessages(res.data?.messages || []);
        } catch {
            setMessages([]);
        } finally {
            setMsgLoading(false);
        }

        // Join new room
        joinChatGroup(chat._id);
    };

    useEffect(() => {
        return () => {
            // When leaving the chat page, stop suppressing notifications
            setActiveChatGroupId?.(null);
        };
    }, []);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        sendChatGroupMessage(selectedChat._id, newMessage.trim());
        setNewMessage('');
        setShowEmoji(false);
        inputRef.current?.focus();
    };

    const onEmojiClick = (emojiObj) => {
        setNewMessage((prev) => prev + emojiObj.emoji);
        inputRef.current?.focus();
    };

    const getChatName = (chat) => {
        if (chat.name) return chat.name;
        if (chat.isDirectMessage) {
            const other = chat.members?.find(
                (m) => (typeof m === 'string' ? m : m._id) !== user?._id
            );
            return typeof other === 'string' ? 'Direct Message' : other?.name || 'Direct Message';
        }
        return 'Group Chat';
    };

    const filteredChats = chatGroups.filter((c) =>
        getChatName(c).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <div
                className={`
          ${showSidebar ? 'flex' : 'hidden md:flex'}
          w-full md:w-80 lg:w-96 flex-col
          bg-white dark:bg-surface-dark-alt
          border-r border-border dark:border-border-dark
        `}
            >
                {/* Sidebar header */}
                <div className="p-4 border-b border-border dark:border-border-dark">
                    <h2 className="text-lg font-bold text-text-primary dark:text-text-dark mb-3">
                        Messages
                    </h2>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-surface-alt dark:bg-surface-dark
                rounded-xl text-sm text-text-primary dark:text-text-dark
                focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                        />
                    </div>
                </div>

                {/* Chat list */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10" rounded />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-24 mb-1" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredChats.length > 0 ? (
                        filteredChats.map((chat) => {
                            const name = getChatName(chat);
                            const isSelected = selectedChat?._id === chat._id;

                            return (
                                <button
                                    key={chat._id}
                                    onClick={() => selectChat(chat)}
                                    className={`w-full flex items-center gap-3 px-4 py-3
                    transition-colors cursor-pointer text-left ${isSelected
                                            ? 'bg-accent-purple/5 dark:bg-accent-purple/10 border-r-2 border-accent-purple'
                                            : 'hover:bg-surface-alt dark:hover:bg-surface-dark'
                                        }`}
                                >
                                    <div className="relative">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${chat.isDirectMessage ? 'gradient-bg' : 'bg-primary'
                                            }`}>
                                            {chat.isDirectMessage ? name.charAt(0) : <Hash size={16} />}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${isSelected ? 'font-bold text-accent-purple' : 'font-medium text-text-primary dark:text-text-dark'
                                            }`}>
                                            {name}
                                        </p>
                                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">
                                            {chat.members?.length || 0} members
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center">
                            <MessageCircle size={32} className="mx-auto mb-2 text-text-secondary/30" />
                            <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                                {searchTerm ? 'No conversations found' : 'No conversations yet'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`
        ${!showSidebar ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col bg-surface-alt dark:bg-surface-dark
      `}>
                {selectedChat ? (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 px-4 py-3
              bg-white dark:bg-surface-dark-alt
              border-b border-border dark:border-border-dark">
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="md:hidden text-text-secondary cursor-pointer"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
                                {getChatName(selectedChat).charAt(0)}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-text-primary dark:text-text-dark">
                                    {getChatName(selectedChat)}
                                </p>
                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                    {selectedChat.members?.length || 0} members
                                    {typingUsers.length > 0 && (
                                        <span className="text-accent-purple ml-2">
                                            {typingUsers.map((u) => u.userName).join(', ')} typing...
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {msgLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                                            <Skeleton className="h-10 w-48 rounded-2xl" />
                                        </div>
                                    ))}
                                </div>
                            ) : messages.length > 0 ? (
                                messages.map((msg, i) => {
                                    const isMine =
                                        (typeof msg.sender === 'string' ? msg.sender : msg.sender?._id) === user?._id;
                                    const senderName =
                                        typeof msg.sender === 'string' ? 'User' : msg.sender?.name || 'User';

                                    return (
                                        <motion.div
                                            key={msg._id || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-xs sm:max-w-md ${isMine ? 'order-2' : ''}`}>
                                                {!isMine && (
                                                    <p className="text-[10px] text-text-secondary dark:text-text-dark-secondary mb-0.5 px-3">
                                                        {senderName}
                                                    </p>
                                                )}
                                                <div
                                                    className={`px-4 py-2 rounded-2xl text-sm ${isMine
                                                        ? 'gradient-bg text-white rounded-br-md'
                                                        : 'bg-white dark:bg-surface-dark-alt text-text-primary dark:text-text-dark rounded-bl-md'
                                                        }`}
                                                >
                                                    {msg.content}
                                                </div>
                                                <p className={`text-[9px] text-text-secondary/60 mt-0.5 ${isMine ? 'text-right' : 'text-left'
                                                    } px-3`}>
                                                    {msg.createdAt
                                                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                                                            hour: '2-digit', minute: '2-digit',
                                                        })
                                                        : ''}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <MessageCircle size={48} className="mx-auto mb-3 text-text-secondary/20" />
                                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                                            No messages yet. Start the conversation!
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="relative px-4 py-3 bg-white dark:bg-surface-dark-alt
              border-t border-border dark:border-border-dark">
                            {showEmoji && (
                                <div className="absolute bottom-full right-4 mb-2 z-10">
                                    <EmojiPicker
                                        onEmojiClick={onEmojiClick}
                                        theme="auto"
                                        width={300}
                                        height={350}
                                    />
                                </div>
                            )}
                            <form onSubmit={handleSend} className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEmoji(!showEmoji)}
                                    className="text-text-secondary hover:text-accent-purple transition-colors cursor-pointer"
                                >
                                    <Smile size={20} />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-surface-alt dark:bg-surface-dark
                    px-4 py-2 rounded-xl text-sm
                    text-text-primary dark:text-text-dark
                    focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                                />
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center
                    text-white disabled:opacity-50 cursor-pointer"
                                >
                                    <Send size={16} />
                                </motion.button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageCircle size={64} className="mx-auto mb-4 text-text-secondary/20" />
                            <h3 className="text-lg font-semibold text-text-primary dark:text-text-dark mb-1">
                                Select a conversation
                            </h3>
                            <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                                Choose from your existing conversations or start a new one.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
