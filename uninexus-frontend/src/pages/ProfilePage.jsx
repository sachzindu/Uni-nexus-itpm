import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, BookOpen, Calendar, Edit3, Save, X, Bell, Check, UserPlus, Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { friendRequestAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const departments = [
    'Computer Science', 'Engineering', 'Business', 'Arts & Design',
    'Medicine', 'Law', 'Sciences', 'Education', 'Social Sciences', 'Architecture',
];

const ProfilePage = () => {
    const { user, updateProfile } = useAuth();
    const toast = useToast();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        department: user?.department || '',
        year: user?.year?.toString() || '',
        bio: user?.bio || '',
    });

    // Notification state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [respondingId, setRespondingId] = useState(null);
    const notifRef = useRef(null);

    // Fetch friend request notifications
    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const res = await friendRequestAPI.getReceived();
            setNotifications(res.data.requests || []);
        } catch {
            // silently fail
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Close notifications on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRespond = async (requestId, status) => {
        setRespondingId(requestId);
        try {
            await friendRequestAPI.respond(requestId, status);
            setNotifications((prev) => prev.filter((n) => n._id !== requestId));
            toast.success(`Friend request ${status}.`);
        } catch (err) {
            toast.error(err.message || 'Failed to respond');
        } finally {
            setRespondingId(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({
                name: form.name.trim(),
                department: form.department,
                year: parseInt(form.year, 10),
                bio: form.bio.trim(),
            });
            toast.success('Profile updated!');
            setEditing(false);
        } catch (err) {
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm({
            name: user?.name || '',
            department: user?.department || '',
            year: user?.year?.toString() || '',
            bio: user?.bio || '',
        });
        setEditing(false);
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Notification bell — top right */}
                <div className="flex justify-end items-center gap-2 mb-4" ref={notifRef}>
                    <Link to="/friends">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="p-2.5 rounded-xl bg-white dark:bg-surface-dark-alt
                                border border-border dark:border-border-dark
                                hover:border-accent-purple transition-all cursor-pointer card-shadow"
                        >
                            <Heart size={20} className="text-text-primary dark:text-text-dark" />
                        </motion.button>
                    </Link>
                    <div className="relative">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                if (!showNotifications) fetchNotifications();
                            }}
                            className="relative p-2.5 rounded-xl bg-white dark:bg-surface-dark-alt
                                border border-border dark:border-border-dark
                                hover:border-accent-purple transition-all cursor-pointer card-shadow"
                        >
                            <Bell size={20} className="text-text-primary dark:text-text-dark" />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-bg
                                    flex items-center justify-center text-white text-[10px] font-bold">
                                    {notifications.length}
                                </span>
                            )}
                        </motion.button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-80 sm:w-96 max-h-96 overflow-y-auto
                                        bg-white dark:bg-surface-dark-alt rounded-2xl card-shadow
                                        border border-border dark:border-border-dark z-50"
                                >
                                    <div className="px-4 py-3 border-b border-border dark:border-border-dark">
                                        <h3 className="text-sm font-bold text-text-primary dark:text-text-dark flex items-center gap-2">
                                            <UserPlus size={16} className="text-accent-purple" />
                                            Friend Requests
                                            {notifications.length > 0 && (
                                                <Badge variant="purple" className="text-[10px]">
                                                    {notifications.length}
                                                </Badge>
                                            )}
                                        </h3>
                                    </div>

                                    {loadingNotifications ? (
                                        <div className="p-4 text-center">
                                            <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                                                Loading...
                                            </p>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <Bell size={32} className="mx-auto mb-2 text-text-secondary/30" />
                                            <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                                                No pending friend requests.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border dark:divide-border-dark">
                                            {notifications.map((notif) => (
                                                <div
                                                    key={notif._id}
                                                    className="px-4 py-3 hover:bg-surface-alt dark:hover:bg-surface-dark transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full gradient-bg flex items-center
                                                            justify-center text-white text-sm font-bold shrink-0">
                                                            {notif.from?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-text-primary dark:text-text-dark truncate">
                                                                {notif.from?.name}
                                                            </p>
                                                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">
                                                                {notif.from?.department || 'Student'}
                                                                {notif.from?.year ? ` • Year ${notif.from.year}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-2 ml-13">
                                                        <button
                                                            onClick={() => handleRespond(notif._id, 'accepted')}
                                                            disabled={respondingId === notif._id}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs
                                                                font-medium gradient-bg text-white hover:opacity-90
                                                                transition-opacity cursor-pointer disabled:opacity-50"
                                                        >
                                                            <Check size={12} />
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRespond(notif._id, 'rejected')}
                                                            disabled={respondingId === notif._id}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs
                                                                font-medium bg-surface-alt dark:bg-surface-dark
                                                                text-text-primary dark:text-text-dark
                                                                border border-border dark:border-border-dark
                                                                hover:border-error hover:text-error
                                                                transition-all cursor-pointer disabled:opacity-50"
                                                        >
                                                            <X size={12} />
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Profile header */}
                <Card hover={false} className="text-center mb-6">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full gradient-bg
            flex items-center justify-center text-white text-3xl font-bold
            animate-pulse-glow">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <h1 className="text-2xl font-extrabold text-text-primary dark:text-text-dark">
                        {user?.name}
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary">
                        {user?.email}
                    </p>
                    <div className="flex justify-center gap-2 mt-3">
                        {user?.department && (
                            <Badge variant="purple">{user.department}</Badge>
                        )}
                        {user?.year && <Badge variant="orange">Year {user.year}</Badge>}
                        <Badge variant={user?.role === 'admin' ? 'gradient' : 'default'}>
                            {user?.role || 'student'}
                        </Badge>
                    </div>
                    {user?.bio && (
                        <p className="mt-4 text-sm text-text-secondary dark:text-text-dark-secondary max-w-md mx-auto">
                            {user.bio}
                        </p>
                    )}
                </Card>

                {/* Interests */}
                <Card hover={false} className="mb-6">
                    <h3 className="text-lg font-bold text-text-primary dark:text-text-dark mb-4">
                        My Interests
                    </h3>
                    {user?.interests?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {user.interests.map((int) => (
                                <div
                                    key={int}
                                    className="px-4 py-2 rounded-2xl bg-white dark:bg-surface-dark
                    border border-border dark:border-border-dark
                    text-sm font-medium text-text-primary dark:text-text-dark
                    card-shadow card-hover"
                                >
                                    {int}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            No interests selected yet.
                        </p>
                    )}
                </Card>

                {/* Edit Profile */}
                <Card hover={false}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-text-primary dark:text-text-dark">
                            Profile Details
                        </h3>
                        {!editing ? (
                            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                                <Edit3 size={14} />
                                Edit
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={handleCancel}>
                                    <X size={14} />
                                    Cancel
                                </Button>
                                <Button variant="gradient" size="sm" onClick={handleSave} loading={saving}>
                                    <Save size={14} />
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Full Name"
                            icon={User}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            disabled={!editing}
                        />

                        <div>
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark mb-1.5">
                                Department
                            </label>
                            <select
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                disabled={!editing}
                                className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark
                  border border-border dark:border-border-dark rounded-xl
                  text-text-primary dark:text-text-dark
                  focus:outline-none focus:ring-2 focus:ring-accent-purple/50
                  disabled:opacity-60"
                            >
                                <option value="">Select department</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark mb-1.5">
                                Year of Study
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((y) => (
                                    <button
                                        key={y}
                                        type="button"
                                        onClick={() => editing && setForm({ ...form, year: y.toString() })}
                                        disabled={!editing}
                                        className={`py-2 rounded-xl font-medium text-sm transition-all ${!editing ? 'cursor-default' : 'cursor-pointer'
                                            } ${form.year === y.toString()
                                                ? 'gradient-bg text-white'
                                                : 'bg-surface-alt dark:bg-surface-dark border border-border dark:border-border-dark text-text-primary dark:text-text-dark'
                                            } disabled:opacity-60`}
                                    >
                                        Year {y}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                                Bio
                            </label>
                            <textarea
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                disabled={!editing}
                                rows={3}
                                placeholder="Tell people about yourself..."
                                className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark
                  border border-border dark:border-border-dark rounded-xl
                  text-text-primary dark:text-text-dark
                  focus:outline-none focus:ring-2 focus:ring-accent-purple/50
                  resize-none disabled:opacity-60"
                            />
                        </div>
                    </div>
                </Card>

                {/* Activity summary */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    {[
                        { label: 'Groups', value: user?.groups?.length || 0, icon: BookOpen },
                        { label: 'Events', value: user?.events?.length || 0, icon: Calendar },
                        { label: 'Posts', value: user?.posts?.length || 0, icon: Edit3 },
                    ].map(({ label, value, icon: Icon }) => (
                        <Card key={label} hover={false} className="text-center !p-4">
                            <Icon size={20} className="mx-auto mb-1 text-accent-purple" />
                            <p className="text-xl font-bold text-text-primary dark:text-text-dark">{value}</p>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{label}</p>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;
