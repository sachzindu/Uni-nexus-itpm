import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, BookOpen, Calendar, Edit3, UserPlus, Check, Clock, X,
} from 'lucide-react';
import { userAPI, friendRequestAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Loader';

const StudentProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const toast = useToast();

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestStatus, setRequestStatus] = useState(null); // null | 'pending' | 'accepted' | 'rejected'
    const [requestDirection, setRequestDirection] = useState(null); // 'sent' | 'received'
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [userRes, statusRes] = await Promise.all([
                    userAPI.getUserById(id),
                    friendRequestAPI.getStatus(id),
                ]);
                setStudent(userRes.data.user);

                const req = statusRes.data.request;
                if (req) {
                    setRequestStatus(req.status);
                    setRequestDirection(
                        req.from === currentUser?._id || req.from?._id === currentUser?._id
                            ? 'sent'
                            : 'received'
                    );
                }
            } catch (err) {
                toast.error(err.message || 'Failed to load profile');
                navigate('/discover');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    const handleSendRequest = async () => {
        setSending(true);
        try {
            await friendRequestAPI.send(id);
            setRequestStatus('pending');
            setRequestDirection('sent');
            toast.success('Friend request sent!');
        } catch (err) {
            toast.error(err.message || 'Failed to send friend request');
        } finally {
            setSending(false);
        }
    };

    // Don't show profile page for own profile — redirect
    const isOwnProfile = currentUser?._id === id;

    const renderFriendButton = () => {
        if (isOwnProfile) return null;

        if (requestStatus === 'accepted') {
            return (
                <Button variant="secondary" disabled>
                    <Check size={16} />
                    Friends
                </Button>
            );
        }

        if (requestStatus === 'pending' && requestDirection === 'sent') {
            return (
                <Button variant="secondary" disabled>
                    <Clock size={16} />
                    Request Sent
                </Button>
            );
        }

        if (requestStatus === 'pending' && requestDirection === 'received') {
            return (
                <Button variant="secondary" disabled>
                    <Clock size={16} />
                    Request Received
                </Button>
            );
        }

        return (
            <Button variant="gradient" onClick={handleSendRequest} loading={sending}>
                <UserPlus size={16} />
                Add Friend
            </Button>
        );
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-surface-dark-alt rounded-3xl p-8">
                    <div className="flex justify-center mb-4">
                        <Skeleton className="w-24 h-24" rounded />
                    </div>
                    <Skeleton className="h-6 w-40 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        );
    }

    if (!student) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Back button */}
                <button
                    onClick={() => navigate('/discover')}
                    className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-dark-secondary
                        hover:text-accent-purple transition-colors mb-6 cursor-pointer"
                >
                    <ArrowLeft size={16} />
                    Back to Discover
                </button>

                {/* Profile header */}
                <Card hover={false} className="text-center mb-6">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full gradient-bg
                        flex items-center justify-center text-white text-3xl font-bold
                        animate-pulse-glow">
                        {student.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <h1 className="text-2xl font-extrabold text-text-primary dark:text-text-dark">
                        {student.name}
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary">
                        {student.email}
                    </p>
                    <div className="flex justify-center gap-2 mt-3">
                        {student.department && (
                            <Badge variant="purple">{student.department}</Badge>
                        )}
                        {student.year && <Badge variant="orange">Year {student.year}</Badge>}
                    </div>
                    {student.bio && (
                        <p className="mt-4 text-sm text-text-secondary dark:text-text-dark-secondary max-w-md mx-auto">
                            {student.bio}
                        </p>
                    )}

                    {/* Friend request button */}
                    <div className="mt-6">
                        {renderFriendButton()}
                    </div>
                </Card>

                {/* Interests */}
                <Card hover={false} className="mb-6">
                    <h3 className="text-lg font-bold text-text-primary dark:text-text-dark mb-4">
                        Interests
                    </h3>
                    {student.interests?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {student.interests.map((int) => (
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
                            No interests listed.
                        </p>
                    )}
                </Card>

                {/* Activity summary */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Groups', value: student.groups?.length || 0, icon: BookOpen },
                        { label: 'Events', value: student.events?.length || 0, icon: Calendar },
                        { label: 'Posts', value: student.posts?.length || 0, icon: Edit3 },
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

export default StudentProfilePage;
