import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Users,
    Calendar,
    Bell,
    UserPlus,
    Check,
    Heart,
    MessageCircle,
    Search,
    Sun,
    Moon,
    Menu,
    X,
    ChevronDown,
    LogOut,
    User,
    Compass,
    LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import UserAvatar from '../ui/UserAvatar';
import { friendRequestAPI } from '../../services/api';
import { useToast } from '../ui/Toast';
import Badge from '../ui/Badge';

const navLinks = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/discover', label: 'Discover', icon: Compass },
    { path: '/groups', label: 'Groups', icon: LayoutGrid },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
];

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Notification state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [respondingId, setRespondingId] = useState(null);
    const notifRef = useRef(null);
    const toast = useToast();

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
        if (isAuthenticated) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setShowNotifications(false);
        }
    }, [isAuthenticated]);

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

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setProfileOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-1">
                        <span className="text-xl font-bold text-primary dark:text-white">
                            Uni<span className="gradient-text">Nexus</span>
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    {isAuthenticated && (
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map(({ path, label, icon: Icon }) => (
                                <Link
                                    key={path}
                                    to={path}
                                    className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-xl
                    text-sm font-medium transition-all duration-200
                    ${isActive(path)
                                            ? 'text-accent-purple'
                                            : 'text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark'
                                        }
                  `}
                                >
                                    <Icon size={18} />
                                    {label}
                                    {isActive(path) && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute bottom-0 left-2 right-2 h-0.5 gradient-bg rounded-full"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Dark mode toggle */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleDarkMode}
                            className="p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-surface-dark-alt
                text-text-secondary dark:text-text-dark-secondary transition-colors cursor-pointer"
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </motion.button>

                        {/* Notifications & Heart */}
                        {isAuthenticated && (
                            <div className="flex items-center gap-2" ref={notifRef}>
                                <Link to="/friends" className="hidden sm:block">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        className="p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-surface-dark-alt
                                            text-text-secondary dark:text-text-dark-secondary transition-colors cursor-pointer"
                                    >
                                        <Heart size={20} />
                                    </motion.button>
                                </Link>

                                <div className="relative">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            setShowNotifications(!showNotifications);
                                            if (!showNotifications) fetchNotifications();
                                        }}
                                        className="relative p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-surface-dark-alt
                                            text-text-secondary dark:text-text-dark-secondary transition-colors cursor-pointer"
                                    >
                                        <Bell size={20} />
                                        {notifications.length > 0 && (
                                            <span className="absolute top-0 right-0 w-4 h-4 rounded-full gradient-bg
                                                flex items-center justify-center text-white text-[9px] font-bold">
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
                                                className="absolute right-0 mt-2 w-80 sm:w-80 max-h-96 overflow-y-auto
                                                    bg-white dark:bg-surface-dark-alt rounded-2xl card-shadow
                                                    border border-border dark:border-border-dark z-50"
                                            >
                                                <div className="px-4 py-3 border-b border-border dark:border-border-dark flex items-center justify-between">
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
                                                                    <UserAvatar user={notif.from} size="sm" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold text-text-primary dark:text-text-dark truncate">
                                                                            {notif.from?.name}
                                                                        </p>
                                                                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">
                                                                            {notif.from?.department || 'Student'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 mt-2 ml-11">
                                                                    <button
                                                                        onClick={() => handleRespond(notif._id, 'accepted')}
                                                                        disabled={respondingId === notif._id}
                                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs
                                                                            font-medium gradient-bg text-white hover:opacity-90
                                                                            transition-opacity cursor-pointer disabled:opacity-50 flex-1 justify-center"
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
                                                                            transition-all cursor-pointer disabled:opacity-50 flex-1 justify-center"
                                                                    >
                                                                        <X size={12} />
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="p-2 border-t border-border dark:border-border-dark sm:hidden">
                                                    <Link
                                                        to="/friends"
                                                        onClick={() => setShowNotifications(false)}
                                                        className="block text-center text-sm text-accent-purple font-medium hover:underline py-1"
                                                    >
                                                        View All Friends
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Profile dropdown (only when authenticated) */}
                        {isAuthenticated && (
                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 p-1 rounded-xl
                    hover:bg-surface-alt dark:hover:bg-surface-dark-alt
                    transition-colors cursor-pointer"
                                >
                                    <UserAvatar user={user} size="xs" />
                                    <ChevronDown
                                        size={16}
                                        className={`text-text-secondary transition-transform ${profileOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-56 py-2
                        bg-white dark:bg-surface-dark-alt
                        rounded-2xl card-shadow border border-border dark:border-border-dark"
                                        >
                                            <div className="px-4 py-2 border-b border-border dark:border-border-dark">
                                                <p className="text-sm font-semibold text-text-primary dark:text-text-dark">
                                                    {user?.name}
                                                </p>
                                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                                    {user?.email}
                                                </p>
                                            </div>
                                            <Link
                                                to="/profile"
                                                onClick={() => setProfileOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5
                          text-sm text-text-primary dark:text-text-dark
                          hover:bg-surface-alt dark:hover:bg-surface-dark
                          transition-colors"
                                            >
                                                <User size={16} />
                                                My Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5
                          text-sm text-error
                          hover:bg-surface-alt dark:hover:bg-surface-dark
                          transition-colors cursor-pointer"
                                            >
                                                <LogOut size={16} />
                                                Logout
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Auth buttons (when not authenticated) */}
                        {!isAuthenticated && (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-text-primary dark:text-text-dark
                    hover:text-accent-purple transition-colors"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 text-sm font-semibold text-white
                    gradient-bg rounded-xl hover:opacity-90 transition-opacity"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-surface-dark-alt
                text-text-secondary dark:text-text-dark-secondary cursor-pointer"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-border dark:border-border-dark glass"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {isAuthenticated ? (
                                navLinks.map(({ path, label, icon: Icon }) => (
                                    <Link
                                        key={path}
                                        to={path}
                                        onClick={() => setMobileOpen(false)}
                                        className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      text-sm font-medium transition-all
                      ${isActive(path)
                                                ? 'gradient-bg text-white'
                                                : 'text-text-primary dark:text-text-dark hover:bg-surface-alt dark:hover:bg-surface-dark'
                                            }
                    `}
                                    >
                                        <Icon size={18} />
                                        {label}
                                    </Link>
                                ))
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="block px-4 py-3 text-sm font-medium text-text-primary dark:text-text-dark"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setMobileOpen(false)}
                                        className="block px-4 py-3 text-sm font-semibold text-white gradient-bg rounded-xl text-center"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
