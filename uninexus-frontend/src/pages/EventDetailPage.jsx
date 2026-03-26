import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, MapPin, Users, Clock, Check, Copy,
    Ticket,
} from 'lucide-react';
import { eventAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StarRating from '../components/ui/StarRating';
import Loader from '../components/ui/Loader';
import UserAvatar from '../components/ui/UserAvatar';

const EventDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [regId, setRegId] = useState('');
    const [userRating, setUserRating] = useState(0);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await eventAPI.getById(id);
                setEvent(res.data);
            } catch {
                toast.error('Event not found');
                navigate('/events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const isRegistered = event?.attendees?.some(
        (a) => (typeof a === 'string' ? a : a._id) === user?._id
    );

    const handleRegister = async () => {
        setRegistering(true);
        try {
            await eventAPI.register(id);
            // Generate a unique registration ID
            const uniqueId = `UNI-${Date.now().toString(36).toUpperCase()}-${Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase()}`;
            setRegId(uniqueId);
            setShowSuccess(true);
            // Refresh event data
            const res = await eventAPI.getById(id);
            setEvent(res.data);
        } catch (err) {
            toast.error(err.message || 'Registration failed');
        } finally {
            setRegistering(false);
        }
    };

    const handleUnregister = async () => {
        try {
            await eventAPI.unregister(id);
            toast.success('Unregistered from event');
            const res = await eventAPI.getById(id);
            setEvent(res.data);
        } catch (err) {
            toast.error(err.message || 'Failed to unregister');
        }
    };

    const copyRegId = () => {
        navigator.clipboard.writeText(regId);
        toast.success('Registration ID copied!');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (!event) return null;

    const statusColors = {
        upcoming: 'purple',
        ongoing: 'success',
        completed: 'default',
        cancelled: 'error',
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back */}
            <button
                onClick={() => navigate('/events')}
                className="flex items-center gap-2 text-text-secondary dark:text-text-dark-secondary
          hover:text-text-primary dark:hover:text-text-dark mb-6 cursor-pointer"
            >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back to Events</span>
            </button>

            {/* Event Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-surface-dark-alt rounded-3xl card-shadow overflow-hidden mb-6"
            >
                {/* Banner gradient */}
                <div className="h-32 gradient-bg relative">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute bottom-4 left-6">
                        <Badge variant={statusColors[event.status] || 'default'} className="text-sm">
                            {event.status}
                        </Badge>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary dark:text-text-dark mb-2">
                        {event.title}
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
                        {event.description || 'No description provided.'}
                    </p>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-accent-purple" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Date & Time</p>
                                <p className="text-sm font-medium text-text-primary dark:text-text-dark">
                                    {new Date(event.eventDate).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-accent-orange" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Location</p>
                                <p className="text-sm font-medium text-text-primary dark:text-text-dark">
                                    {event.location || 'TBA'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-success" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Attendees</p>
                                <p className="text-sm font-medium text-text-primary dark:text-text-dark">
                                    {event.attendees?.length || 0}
                                    {event.maxAttendees ? ` / ${event.maxAttendees}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-500" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Organized by</p>
                                <p className="text-sm font-medium text-text-primary dark:text-text-dark">
                                    {event.organizer?.name || 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {event.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-6">
                            {event.tags.map((tag) => (
                                <Badge key={tag} variant="purple" className="text-[10px]">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Action */}
                    {event.status !== 'cancelled' && event.status !== 'completed' && (
                        <div>
                            {isRegistered ? (
                                <div className="flex items-center gap-3">
                                    <Badge variant="success" className="text-sm px-4 py-2">
                                        <Check size={14} />
                                        Registered
                                    </Badge>
                                    <Button variant="ghost" size="sm" onClick={handleUnregister}>
                                        Cancel Registration
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="gradient"
                                    size="lg"
                                    onClick={handleRegister}
                                    loading={registering}
                                    disabled={event.isFull}
                                >
                                    <Ticket size={18} />
                                    {event.isFull ? 'Event is Full' : 'Register Now'}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Attendees */}
            <Card hover={false} className="mb-6">
                <h3 className="text-lg font-bold text-text-primary dark:text-text-dark mb-4">
                    Attendees ({event.attendees?.length || 0})
                </h3>
                {event.attendees?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {event.attendees.map((att) => {
                            const a = typeof att === 'string' ? { _id: att, name: '?' } : att;
                            return (
                                <div
                                    key={a._id}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full
                    bg-surface-alt dark:bg-surface-dark text-sm"
                                >
                                    <UserAvatar user={a} size="xs" className="!w-6 !h-6 !text-[10px]" />
                                    <span className="text-text-primary dark:text-text-dark text-xs font-medium">
                                        {a.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                        No attendees yet. Be the first to register!
                    </p>
                )}
            </Card>

            {/* Feedback / Rating */}
            {event.status === 'completed' && (
                <Card hover={false}>
                    <h3 className="text-lg font-bold text-text-primary dark:text-text-dark mb-4">
                        Rate this Event
                    </h3>
                    <div className="flex items-center gap-4">
                        <StarRating rating={userRating} onChange={setUserRating} size={28} />
                        <span className="text-sm text-text-secondary">
                            {userRating > 0 ? `You rated ${userRating}/5` : 'Tap to rate'}
                        </span>
                    </div>
                </Card>
            )}

            {/* Registration Success Modal */}
            <Modal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title="Registration Successful! 🎉"
                size="sm"
            >
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                        <Check size={32} className="text-success" />
                    </div>
                    <p className="text-text-primary dark:text-text-dark">
                        You&apos;re registered for <strong>{event.title}</strong>!
                    </p>
                    <div className="bg-surface-alt dark:bg-surface-dark rounded-2xl p-4">
                        <p className="text-xs text-text-secondary mb-1">Your Registration ID</p>
                        <div className="flex items-center justify-center gap-2">
                            <code className="text-lg font-mono font-bold gradient-text">{regId}</code>
                            <button onClick={copyRegId} className="text-text-secondary hover:text-accent-purple cursor-pointer">
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                        Save this ID — you may need it at check-in.
                    </p>
                    <Button variant="gradient" onClick={() => setShowSuccess(false)} className="w-full">
                        Done
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default EventDetailPage;
