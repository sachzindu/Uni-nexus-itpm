import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Smile, MessageCircle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Skeleton } from '../ui/Loader';
import { useToast } from '../ui/Toast';

const GroupChatTab = ({ groupId }) => {
    const { user } = useAuth();
    const { socket, joinRoom, leaveRoom, sendMessage } = useSocket();
    const toast = useToast();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEmoji, setShowEmoji] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Fetch messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await chatAPI.getGroupMessages(groupId);
                setMessages(res.data?.messages || res.data || []);
            } catch (err) {
                toast.error('Failed to load chat messages');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Join socket room
        joinRoom(groupId);

        return () => {
             leaveRoom(groupId);
        };
    }, [groupId, joinRoom, leaveRoom, toast]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg) => {
            // Check if it belongs to this group
            if (msg.group === groupId || msg.group?._id === groupId) {
               setMessages((prev) => [...prev, msg]);
            }
        };

        const handleTyping = ({ userId, userName, groupId: gId }) => {
            if (gId === groupId && userId !== user?._id) {
                setTypingUsers((prev) => {
                    if (!prev.find((u) => u.userId === userId)) {
                        return [...prev, { userId, userName }];
                    }
                    return prev;
                });
            }
        };

        const handleStopTyping = ({ userId, groupId: gId }) => {
            if (gId === groupId) {
               setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
            }
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('userTyping', handleTyping);
        socket.on('userStopTyping', handleStopTyping);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('userTyping', handleTyping);
            socket.off('userStopTyping', handleStopTyping);
        };
    }, [socket, groupId, user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        sendMessage(groupId, newMessage.trim());
        setNewMessage('');
        setShowEmoji(false);
        socket?.emit('stopTyping', { groupId });
        
        inputRef.current?.focus();
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        socket?.emit('typing', { groupId });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            socket?.emit('stopTyping', { groupId });
        }, 2000);
    };

    const onEmojiClick = (emojiObj) => {
        setNewMessage((prev) => prev + emojiObj.emoji);
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col bg-white dark:bg-surface-dark-alt rounded-3xl card-shadow h-[600px] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border dark:border-border-dark flex items-center justify-between shrink-0">
                <div>
                   <h3 className="font-bold text-lg text-text-primary dark:text-text-dark">Group Chat</h3>
                   <p className="text-xs text-text-secondary dark:text-text-dark-secondary h-4">
                        {typingUsers.length > 0 
                            ? <span className="text-accent-purple animate-pulse">{typingUsers.map(u => u.userName).join(', ')} typing...</span>
                            : "Real-time discussion area"
                        }
                   </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-alt/50 dark:bg-surface-dark/50">
                {loading ? (
                    <div className="space-y-4">
                         {[1, 2, 3].map((i) => (
                             <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                 <Skeleton className="h-12 w-64 rounded-2xl" />
                             </div>
                         ))}
                    </div>
                ) : messages.length > 0 ? (
                    messages.map((msg, i) => {
                        const isMine =
                            (typeof msg.sender === 'string' ? msg.sender : msg.sender?._id) === user?._id;
                        const senderName =
                            typeof msg.sender === 'string' ? 'User' : msg.sender?.name || 'User';
                        const avatar = msg.sender?.avatar || null;

                        return (
                            <motion.div
                                key={msg._id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                                {!isMine && (
                                   <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold mr-2 mt-auto mb-5 shrink-0 overflow-hidden">
                                       {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover"/> : senderName.charAt(0)}
                                   </div>
                                )}
                                <div className={`max-w-[75%] sm:max-w-md ${isMine ? 'order-2' : ''}`}>
                                    {!isMine && (
                                        <p className="text-[11px] font-medium text-text-secondary dark:text-text-dark-secondary mb-1 px-1">
                                            {senderName}
                                        </p>
                                    )}
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${isMine
                                            ? 'gradient-bg text-white rounded-br-sm'
                                            : 'bg-white dark:bg-surface-dark-alt text-text-primary dark:text-text-dark rounded-bl-sm border border-border/50 dark:border-border-dark/50'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <p className={`text-[10px] text-text-secondary/60 mt-1 ${isMine ? 'text-right mr-1' : 'text-left ml-1'
                                        }`}>
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
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-full bg-surface-alt dark:bg-surface-dark flex items-center justify-center mb-4 text-text-secondary/40">
                             <MessageCircle size={32} />
                        </div>
                        <p className="text-text-primary dark:text-text-dark font-medium mb-1">It's quiet here...</p>
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            Be the first to send a message to the group!
                        </p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border dark:border-border-dark bg-white dark:bg-surface-dark-alt relative shrink-0">
                {showEmoji && (
                    <div className="absolute bottom-[100%] left-4 mb-2 z-50">
                        <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            theme="auto"
                            width={320}
                            height={400}
                        />
                    </div>
                )}
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowEmoji(!showEmoji)}
                        className="p-2 text-text-secondary hover:text-accent-purple hover:bg-accent-purple/10 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                        <Smile size={22} />
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Write a message..."
                        className="flex-1 bg-surface-alt dark:bg-surface-dark px-5 py-3 rounded-2xl text-[15px]
                        text-text-primary dark:text-text-dark border border-transparent
                        focus:outline-none focus:border-accent-purple/30 focus:ring-4 focus:ring-accent-purple/10 transition-all placeholder:text-text-secondary/60"
                    />
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center
                        text-white disabled:opacity-50 cursor-pointer shadow-md shadow-accent-purple/20 shrink-0"
                    >
                        <Send size={18} className="translate-x-[2px] -translate-y-[2px]" />
                    </motion.button>
                </form>
            </div>
        </div>
    );
};

export default GroupChatTab;
