import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MessageCircle, Users, ArrowLeft, Search,
} from 'lucide-react';
import { friendRequestAPI, chatGroupAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Loader';

const FriendsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();

    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [startingChat, setStartingChat] = useState(null);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await friendRequestAPI.getFriends();
                setFriends(res.data.friends || []);
            } catch {
                setFriends([]);
            } finally {
                setLoading(false);
            }
        };
        fetchFriends();
    }, []);

    const handleStartChat = async (friendId) => {
        setStartingChat(friendId);
        try {
            const res = await chatGroupAPI.create({
                isDirectMessage: true,
                memberIds: [friendId],
            });
            const chatGroup = res.data?.chatGroup || res.chatGroup;
            if (chatGroup?._id) {
                navigate(`/chat?chatId=${chatGroup._id}`);
            } else {
                navigate('/chat');
            }
        } catch (err) {
            toast.error(err.message || 'Failed to start chat');
        } finally {
            setStartingChat(null);
        }
    };

    const filteredFriends = friends.filter((f) =>
        f.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-surface-dark-alt
                            text-text-secondary transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-text-primary dark:text-text-dark">
                            My <span className="gradient-text">Friends</span>
                        </h1>
                        <p className="text-text-secondary dark:text-text-dark-secondary mt-0.5">
                            {friends.length} friend{friends.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Search */}
                {friends.length > 0 && (
                    <div className="relative mb-6">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-surface-dark-alt
                                border border-border dark:border-border-dark rounded-xl
                                text-text-primary dark:text-text-dark
                                focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                        />
                    </div>
                )}

                {/* Friends Grid */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white dark:bg-surface-dark-alt rounded-3xl p-5">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-14 h-14" rounded />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-28 mb-2" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="w-9 h-9" rounded />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredFriends.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {filteredFriends.map((friend) => (
                            <Card key={friend._id} className="!p-0 overflow-hidden">
                                <div className="flex items-center gap-4 p-5">
                                    {/* Avatar */}
                                    <div
                                        className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center
                                            text-white text-lg font-bold shrink-0 cursor-pointer"
                                        onClick={() => navigate(`/students/${friend._id}`)}
                                    >
                                        {friend.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>

                                    {/* Info */}
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => navigate(`/students/${friend._id}`)}
                                    >
                                        <p className="font-semibold text-text-primary dark:text-text-dark truncate">
                                            {friend.name}
                                        </p>
                                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">
                                            {friend.department || 'Student'}
                                            {friend.year ? ` • Year ${friend.year}` : ''}
                                        </p>
                                        {friend.interests?.length > 0 && (
                                            <div className="flex gap-1 mt-1.5">
                                                {friend.interests.slice(0, 2).map((int) => (
                                                    <Badge key={int} variant="default" className="text-[10px]">
                                                        {int}
                                                    </Badge>
                                                ))}
                                                {friend.interests.length > 2 && (
                                                    <Badge variant="purple" className="text-[10px]">
                                                        +{friend.interests.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat button */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleStartChat(friend._id)}
                                        disabled={startingChat === friend._id}
                                        className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center
                                            text-white hover:opacity-90 transition-opacity cursor-pointer
                                            disabled:opacity-50 shrink-0"
                                        title={`Chat with ${friend.name}`}
                                    >
                                        {startingChat === friend._id ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <MessageCircle size={18} />
                                        )}
                                    </motion.button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card hover={false} className="text-center py-16">
                        <Users size={48} className="mx-auto mb-4 text-text-secondary/30" />
                        <p className="text-text-secondary dark:text-text-dark-secondary">
                            {search
                                ? 'No friends match your search.'
                                : 'You haven\'t added any friends yet. Go to Discover to find people!'}
                        </p>
                    </Card>
                )}
            </motion.div>
        </div>
    );
};

export default FriendsPage;
