import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Users, Tag, LayoutGrid, Check } from 'lucide-react';
import { groupAPI, friendRequestAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Skeleton } from '../components/ui/Loader';

const GroupsPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', description: '', tags: '' });
    const [creating, setCreating] = useState(false);

    // Friends selector state
    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState([]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            const res = await groupAPI.getAll(params);
            setGroups(res.data?.groups || []);
        } catch {
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    // Fetch friends when modal opens
    useEffect(() => {
        if (showCreate) {
            const loadFriends = async () => {
                setLoadingFriends(true);
                try {
                    const res = await friendRequestAPI.getFriends();
                    setFriends(res.data.friends || []);
                } catch {
                    setFriends([]);
                } finally {
                    setLoadingFriends(false);
                }
            };
            loadFriends();
        } else {
            // Reset on close
            setSelectedFriends([]);
            setFriends([]);
        }
    }, [showCreate]);

    const toggleFriend = (friendId) => {
        setSelectedFriends((prev) =>
            prev.includes(friendId)
                ? prev.filter((id) => id !== friendId)
                : [...prev, friendId]
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchGroups();
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.name.trim()) return;
        setCreating(true);
        try {
            await groupAPI.create({
                name: createForm.name.trim(),
                description: createForm.description.trim(),
                tags: createForm.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                memberIds: selectedFriends,
            });
            toast.success('Group created successfully!');
            setShowCreate(false);
            setCreateForm({ name: '', description: '', tags: '' });
            fetchGroups();
        } catch (err) {
            toast.error(err.message || 'Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            >
                <div>
                    <h1 className="text-3xl font-extrabold text-text-primary dark:text-text-dark">
                        Interest <span className="gradient-text">Groups</span>
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
                        Join communities that match your passions.
                    </p>
                </div>
                <Button variant="gradient" onClick={() => setShowCreate(true)}>
                    <Plus size={16} />
                    Create Group
                </Button>
            </motion.div>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative mb-6">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                    type="text"
                    placeholder="Search groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark-alt border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                />
            </form>

            {/* Grid */}
            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white dark:bg-surface-dark-alt rounded-3xl p-6">
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-full mb-1" />
                            <Skeleton className="h-3 w-2/3 mb-4" />
                            <div className="flex gap-1">
                                <Skeleton className="h-5 w-12" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : groups.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => {
                        const isMember = group.members?.some(
                            (m) => (typeof m === 'string' ? m : m._id) === user?._id
                        );
                        return (
                            <Link key={group._id} to={`/groups/${group._id}`}>
                                <Card className="h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-white">
                                            <LayoutGrid size={24} />
                                        </div>
                                        {isMember && <Badge variant="success">Member</Badge>}
                                    </div>
                                    <h3 className="font-bold text-text-primary dark:text-text-dark mb-1">
                                        {group.name}
                                    </h3>
                                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary line-clamp-2 mb-3 flex-1">
                                        {group.description || 'No description'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap gap-1">
                                            {group.tags?.slice(0, 2).map((tag) => (
                                                <Badge key={tag} variant="default" className="text-[10px]">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                        <span className="text-xs text-text-secondary dark:text-text-dark-secondary flex items-center gap-1">
                                            <Users size={12} />
                                            {group.members?.length || 0}
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <Card hover={false} className="text-center py-16">
                    <LayoutGrid size={48} className="mx-auto mb-4 text-text-secondary/30" />
                    <p className="text-text-secondary dark:text-text-dark-secondary">No groups found.</p>
                </Card>
            )}

            {/* Create Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Group" size="md">
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                        label="Group Name"
                        placeholder="e.g., Web Dev Club"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                            Description
                        </label>
                        <textarea
                            placeholder="What is this group about?"
                            value={createForm.description}
                            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none"
                        />
                    </div>
                    <Input
                        label="Tags (comma-separated)"
                        placeholder="e.g., web, javascript, design"
                        value={createForm.tags}
                        onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                    />

                    {/* Friends selector */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                            Add Friends to Group
                            {selectedFriends.length > 0 && (
                                <span className="ml-2 text-xs text-accent-purple font-normal">
                                    ({selectedFriends.length} selected)
                                </span>
                            )}
                        </label>
                        {loadingFriends ? (
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ) : friends.length > 0 ? (
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-xl
                                bg-surface-alt dark:bg-surface-dark border border-border dark:border-border-dark">
                                {friends.map((friend) => {
                                    const isSelected = selectedFriends.includes(friend._id);
                                    return (
                                        <button
                                            key={friend._id}
                                            type="button"
                                            onClick={() => toggleFriend(friend._id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                                                font-medium transition-all cursor-pointer ${isSelected
                                                    ? 'gradient-bg text-white'
                                                    : 'bg-white dark:bg-surface-dark-alt text-text-primary dark:text-text-dark border border-border dark:border-border-dark hover:border-accent-purple'
                                                }`}
                                        >
                                            {isSelected && <Check size={12} />}
                                            {friend.name}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                No friends yet. Add friends from the Discover page first.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setShowCreate(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="gradient" loading={creating}>
                            Create Group
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default GroupsPage;
