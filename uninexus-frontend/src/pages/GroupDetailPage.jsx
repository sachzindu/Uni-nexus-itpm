import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Users, Shield, Plus, ThumbsUp, ThumbsDown, MessageCircle,
    Settings, UserPlus, LogOut, Trash2, Check, X, Send, Image, Hash,
} from 'lucide-react';
import { groupAPI, postAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Loader from '../components/ui/Loader';
import Input from '../components/ui/Input';
import UserAvatar from '../components/ui/UserAvatar';
import GroupChatTab from '../components/group/GroupChatTab';

const GroupDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('feed');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '', tags: '' });

    // Open edit modal and populate form
    const openEditModal = () => {
        setEditForm({
            name: group?.name || '',
            description: group?.description || '',
            tags: (group?.tags || []).join(', '),
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        const name = editForm.name.trim();
        const description = editForm.description.trim();
        const tagsArray = editForm.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

        if (!name) return toast.error('Group name is required');
        if (name.length < 3) return toast.error('Group name must be at least 3 characters');
        if (!description) return toast.error('Description is required');
        if (description.length < 10) return toast.error('Description must be at least 10 characters');
        if (tagsArray.length === 0) return toast.error('At least one tag is required');

        setEditLoading(true);
        try {
            const res = await groupAPI.update(id, { name, description, tags: tagsArray });
            setGroup(res.data?.group || res.data);
            toast.success('Group updated successfully');
            setShowEditModal(false);
        } catch (err) {
            toast.error(err.message || 'Failed to update group');
        } finally {
            setEditLoading(false);
        }
    };

    // Delete group handler (admin only)
    const handleDeleteGroup = async () => {
        if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
        setDeleteLoading(true);
        try {
            await groupAPI.delete(id);
            toast.success('Group deleted');
            navigate('/groups');
        } catch (err) {
            toast.error(err.message || 'Failed to delete group');
        } finally {
            setDeleteLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [grpRes, postRes] = await Promise.all([
                    groupAPI.getById(id),
                    postAPI.getByGroup(id),
                ]);
                setGroup(grpRes.data?.group || grpRes.data);
                setPosts(postRes.data?.posts || postRes.data || []);
            } catch (err) {
                toast.error('Failed to load group');
                navigate('/groups');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handlePost = () => {
        navigate(`/groups/${id}/create-post`);
    };

    const handleUpvote = async (postId) => {
        try {
            const res = await postAPI.toggleUpvote(id, postId);
            const updatedPost = res.data?.post;
            if (updatedPost) {
                setPosts((prev) =>
                    prev.map((p) => (p._id === postId ? { ...p, ...updatedPost } : p))
                );
            }
        } catch (err) {
            toast.error('Failed to vote');
        }
    };

    const handleDownvote = async (postId) => {
        try {
            const res = await postAPI.toggleDownvote(id, postId);
            const updatedPost = res.data?.post;
            if (updatedPost) {
                setPosts((prev) =>
                    prev.map((p) => (p._id === postId ? { ...p, ...updatedPost } : p))
                );
            }
        } catch (err) {
            toast.error('Failed to vote');
        }
    };

    const handleJoin = async () => {
        try {
            await groupAPI.requestJoin(id);
            toast.success('Join request sent!');
        } catch (err) {
            toast.error(err.message || 'Failed to request join');
        }
    };

    const handleLeave = async () => {
        try {
            await groupAPI.leave(id);
            toast.info('Left group');
            navigate('/groups');
        } catch (err) {
            toast.error(err.message || 'Failed to leave group');
        }
    };

    const handleJoinRequest = async (requestId, status) => {
        try {
            await groupAPI.handleJoinRequest(id, requestId, { status });
            const grpRes = await groupAPI.getById(id);
            setGroup(grpRes.data?.group || grpRes.data);
            toast.success(`Request ${status}`);
        } catch (err) {
            toast.error(err.message || 'Failed to handle request');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (!group) return null;

    const isAdmin = (group?.admins || []).some(
        (a) => (typeof a === 'string' ? a : a._id) === user?._id
    );
    const isMember = group?.members?.some(
        (m) => (typeof m === 'string' ? m : m._id) === user?._id
    );
    const pendingRequests = group.joinRequests?.filter((r) => r.status === 'pending') || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back */}
            <button
                onClick={() => navigate('/groups')}
                className="flex items-center gap-2 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark mb-6 cursor-pointer"
            >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back to Groups</span>
            </button>

            {/* Group Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-surface-dark-alt rounded-3xl card-shadow p-6 md:p-8 mb-6"
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Group info */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl font-bold">
                            {group.name?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-text-primary dark:text-text-dark">
                                {group.name}
                            </h1>
                            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-0.5">
                                {group.description || 'No description'}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {(group.tags || []).map((tag) => (
                                    <Badge key={tag} variant="purple" className="text-[10px]">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Action buttons */}
                    <div className="flex items-center gap-2">
                        {isMember ? (
                            <>
                                <Badge variant="success">
                                    <Shield size={12} />
                                    {isAdmin ? 'Admin' : 'Member'}
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={handleLeave}>
                                    <LogOut size={14} />
                                    Leave
                                </Button>
                                {isAdmin && (
                                    <>
                                        <Button variant="secondary" size="sm" onClick={openEditModal}>
                                            <Settings size={14} />
                                            Edit Group
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleDeleteGroup}
                                            loading={deleteLoading}
                                            className="border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                                        >
                                            <Trash2 size={14} />
                                            Delete Group
                                        </Button>
                                    </>
                                )}
                            </>
                        ) : (
                            <Button variant="gradient" onClick={handleJoin}>
                                <UserPlus size={16} />
                                Request to Join
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 mt-6 pt-4 border-t border-border dark:border-border-dark">
                    <div className="text-center">
                        <p className="text-lg font-bold text-text-primary dark:text-text-dark">
                            {group.members?.length || 0}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Members</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-text-primary dark:text-text-dark">
                            {posts.length}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Posts</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-text-primary dark:text-text-dark">
                            {group.admins?.length || 0}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Admins</p>
                    </div>
                </div>
            </motion.div>

            {/* Edit Group Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Group">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <Input
                        label="Group Name"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        required
                    />
                    <Input
                        label="Description"
                        name="description"
                        value={editForm.description}
                        onChange={handleEditChange}
                        as="textarea"
                        rows={3}
                    />
                    <Input
                        label="Tags (comma separated)"
                        name="tags"
                        value={editForm.tags}
                        onChange={handleEditChange}
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                        <Button type="submit" variant="gradient" loading={editLoading}>Save</Button>
                    </div>
                </form>
            </Modal>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-surface-alt dark:bg-surface-dark rounded-xl p-1 overflow-x-auto">
                {[
                    { key: 'feed', label: 'Feed', icon: MessageCircle },
                    ...(isMember ? [{ key: 'chat', label: 'Chat', icon: Hash }] : []),
                    { key: 'members', label: 'Members', icon: Users },
                    ...(isAdmin ? [{ key: 'requests', label: `Requests (${pendingRequests.length})`, icon: UserPlus }] : []),
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${tab === key
                            ? 'bg-white dark:bg-surface-dark-alt card-shadow text-text-primary dark:text-text-dark'
                            : 'text-text-secondary dark:text-text-dark-secondary hover:text-text-primary'
                        }`}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Feed Tab */}
            {tab === 'feed' && (
                <div className="space-y-4">
                    {/* Create post (members only) */}
                    {isMember && (
                        <div className="flex justify-between items-center bg-white dark:bg-surface-dark-alt rounded-3xl p-4 card-shadow">
                            <div className="flex items-center gap-3">
                                <UserAvatar user={user} size="sm" />
                                <span className="text-text-secondary dark:text-text-dark-secondary">
                                    Share something with the group...
                                </span>
                            </div>
                            <Button variant="gradient" size="sm" onClick={handlePost}>
                                <Plus size={16} />
                                Create Post
                            </Button>
                        </div>
                    )}

                    {/* Posts */}
                    {posts.length > 0 ? (
                        posts.map((post) => {
                            const hasUpvoted = post.upvotes?.includes(user?._id);
                            const hasDownvoted = post.downvotes?.includes(user?._id);
                            const voteScore = (post.upvoteCount || post.upvotes?.length || 0)
                                - (post.downvoteCount || post.downvotes?.length || 0);
                            const commentCount = post.commentCount ?? post.comments?.length ?? 0;
                            const canDelete = (post.author?._id === user?._id) || isAdmin;

                            return (
                                <Card key={post._id} hover={false}>
                                    {/* Post Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
                                            {(post.author?.name || 'U').charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <UserAvatar user={post.author} size="xs" />
                                            <div>
                                                <p className="text-sm font-semibold text-text-primary dark:text-text-dark">
                                                    {post.author?.name || 'Unknown'}
                                                </p>
                                                <p className="text-[10px] text-text-secondary dark:text-text-dark-secondary">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {canDelete && (
                                            <div className="relative group">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-error hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-error focus:ring-2 focus:ring-error"
                                                    title="Delete post"
                                                    aria-label="Delete post"
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to delete this post?')) {
                                                            try {
                                                                await postAPI.delete(id, post._id);
                                                                setPosts((prev) => prev.filter((p) => p._id !== post._id));
                                                                toast.success('Post deleted');
                                                            } catch (err) {
                                                                toast.error('Failed to delete post');
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                                <span className="absolute z-10 left-1/2 -translate-x-1/2 top-8 opacity-0 group-hover:opacity-100 pointer-events-none bg-error text-white text-xs rounded px-2 py-1 transition-opacity duration-200 shadow-lg whitespace-nowrap">
                                                    Delete post
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Post Content */}
                                    <p className="text-sm text-text-primary dark:text-text-dark whitespace-pre-wrap mb-3">
                                        {post.content}
                                    </p>

                                    {/* Post Image */}
                                    {post.image && (
                                        <div className="w-full flex justify-center mb-3">
                                            <img
                                                src={post.image}
                                                alt=""
                                                className="rounded-2xl max-h-[400px] w-auto object-contain bg-surface-alt dark:bg-surface-dark-alt"
                                                style={{ maxWidth: '100%' }}
                                            />
                                        </div>
                                    )}

                                    {/* Post Actions */}
                                    <div className="flex items-center gap-4 pt-3 border-t border-border dark:border-border-dark">
                                        {/* Vote Controls */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleUpvote(post._id)}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${hasUpvoted
                                                    ? 'text-accent-purple bg-accent-purple/10'
                                                    : 'text-text-secondary hover:text-accent-purple hover:bg-accent-purple/5'
                                                }`}
                                                title="Upvote"
                                            >
                                                <ThumbsUp size={16} className={hasUpvoted ? 'fill-accent-purple' : ''} />
                                            </button>
                                            <span className={`text-sm font-bold min-w-[2ch] text-center ${voteScore > 0
                                                ? 'text-accent-purple'
                                                : voteScore < 0
                                                    ? 'text-red-500'
                                                    : 'text-text-secondary dark:text-text-dark-secondary'
                                            }`}>
                                                {voteScore}
                                            </span>
                                            <button
                                                onClick={() => handleDownvote(post._id)}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${hasDownvoted
                                                    ? 'text-red-500 bg-red-500/10'
                                                    : 'text-text-secondary hover:text-red-500 hover:bg-red-500/5'
                                                }`}
                                                title="Downvote"
                                            >
                                                <ThumbsDown size={16} className={hasDownvoted ? 'fill-red-500' : ''} />
                                            </button>
                                        </div>

                                        {/* Comment Button */}
                                        <button
                                            onClick={() => navigate(`/groups/${id}/posts/${post._id}`)}
                                            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-purple transition-colors cursor-pointer"
                                            title="View comments"
                                        >
                                            <MessageCircle size={16} />
                                            <span>{commentCount}</span>
                                        </button>
                                    </div>
                                </Card>
                            );
                        })
                    ) : (
                        <Card hover={false} className="text-center py-12">
                            <MessageCircle size={48} className="mx-auto mb-3 text-text-secondary/30" />
                            <p className="text-text-secondary dark:text-text-dark-secondary">No posts yet. Be the first to share!</p>
                        </Card>
                    )}
                </div>
            )}

            {/* Chat Tab */}
            {tab === 'chat' && isMember && (
                <GroupChatTab groupId={id} />
            )}

            {/* Members Tab */}
            {tab === 'members' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.members?.map((member) => {
                        const m = typeof member === 'string' ? { _id: member, name: 'User' } : member;
                        const memberIsAdmin = (group.admins || []).some(
                            (a) => (typeof a === 'string' ? a : a._id) === m._id
                        );
                        const canRemove = isAdmin && !memberIsAdmin && m._id !== user?._id;
                        return (
                            <Card key={m._id} hover={false} className="flex items-center gap-3 !p-4">
                                <UserAvatar user={m} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-text-primary dark:text-text-dark truncate">
                                        {m.name}
                                    </p>
                                    {m.department && (
                                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                            {m.department}
                                        </p>
                                    )}
                                </div>
                                {memberIsAdmin && <Badge variant="purple" className="text-[10px]">Admin</Badge>}
                                {canRemove && (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={async () => {
                                            if (!window.confirm(`Remove ${m.name || 'this user'} from the group?`)) return;
                                            try {
                                                await groupAPI.removeMember(id, m._id);
                                                const grpRes = await groupAPI.getById(id);
                                                setGroup(grpRes.data?.group || grpRes.data);
                                                toast.success('Member removed');
                                            } catch (err) {
                                                toast.error(err.message || 'Failed to remove member');
                                            }
                                        }}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Requests Tab (Admin only) */}
            {tab === 'requests' && isAdmin && (
                <div className="space-y-3">
                    {pendingRequests.length > 0 ? (
                        pendingRequests.map((req) => (
                            <Card key={req._id} hover={false} className="flex items-center justify-between !p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-surface-alt dark:bg-surface-dark flex items-center justify-center">
                                        <UserPlus size={18} className="text-text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary dark:text-text-dark">
                                            User {req.user?.toString?.()?.slice(-6) || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            Requested {new Date(req.requestedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="gradient"
                                        size="sm"
                                        onClick={() => handleJoinRequest(req._id, 'approved')}
                                    >
                                        <Check size={14} />
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleJoinRequest(req._id, 'rejected')}
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card hover={false} className="text-center py-12">
                            <p className="text-text-secondary dark:text-text-dark-secondary">No pending requests</p>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default GroupDetailPage;
