import { useState, useEffect, useRef } from 'react';
import Input from '../components/ui/Input';
// Use the same backend URL logic as EventsPage
const BACKEND = import.meta.env.BACKEND_URL || 'http://localhost:3000';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, MapPin, Users, Clock, Check, Copy,
    Ticket,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEventStore } from '../contexts/EventContext';
import { eventAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StarRating from '../components/ui/StarRating';

import Loader from '../components/ui/Loader';
import Skeleton from '../components/ui/Skeleton';

const EventDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const {
        loading,
        getEventById,
        fetchEventById,
        unregisterFromEvent,
    } = useEventStore();
    const toast = useToast();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const event = getEventById(id);
    // Debug: log event object to verify imageUrl
    useEffect(() => {
        if (event) {
            // eslint-disable-next-line no-console
            console.log('Event detail:', event);
        }
    }, [event]);
    const missingToastShownRef = useRef(false);
    const [detailLoading, setDetailLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [regId, setRegId] = useState('');
    const [userRating, setUserRating] = useState(0);
    // Registration modal state
    const [showRegModal, setShowRegModal] = useState(false);
    const [faculty, setFaculty] = useState('');
    const [studentId, setStudentId] = useState('');
    const [formError, setFormError] = useState('');

    // Faculties list (from OnboardingPage.jsx)
    const faculties = [
        'Computing',
        'Engineering',
        'Business',
        'Humanities and sciences',
        'Medicine',
        'William anjilies Institute',
        'Architecture',
    ];

    useEffect(() => {
        let active = true;

        const hydrateEvent = async () => {
            if (loading) {
                if (active) setDetailLoading(true);
                return;
            }

            if (event) {
                if (active) setDetailLoading(false);
                return;
            }

            if (active) setDetailLoading(true);
            const fetched = await fetchEventById(id);

            if (!active) return;
            if (fetched) {
                setDetailLoading(false);
                return;
            }

            setDetailLoading(false);
            if (!missingToastShownRef.current) {
                missingToastShownRef.current = true;
                try {
                    toast.error('Event not found');
                } catch (err) {
                    console.error(err);
                } finally {
                    navigate('/events');
                }
            }
        };

        hydrateEvent();
        return () => {
            active = false;
        };
    }, [event, loading, fetchEventById, id, navigate, toast]);

    const isRegistered = event?.attendees?.some(
        (a) => (typeof a === 'string' ? a : a._id) === user?._id
    );

    // Open modal instead of direct register
    const handleRegister = () => {
        setShowRegModal(true);
        setFormError('');
    };

    // Validate and submit registration
    const handleRegSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        // Validate studentId: 10 chars, alphanumeric
        if (!faculty) {
            setFormError('Please select your faculty.');
            return;
        }
        if (!/^[A-Za-z0-9]{10}$/.test(studentId)) {
            setFormError('Student ID must be 10 letters/numbers.');
            return;
        }
        setRegistering(true);
        try {
            if (!user?._id) {
                throw new Error('Valid user id required');
            }
            await eventAPI.register(id, {
                userId: user._id,
                faculty,
                studentIdNumber: studentId,
            });
            const refetched = await eventAPI.getById(id);
            const nextEvent = refetched?.data?.event || refetched?.data || refetched?.event || refetched;
            if (!nextEvent?._id) {
                throw new Error('Unable to register for this event');
            }
            await fetchEventById(id);
            // Generate a unique registration ID
            const uniqueId = `UNI-${Date.now().toString(36).toUpperCase()}-${Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase()}`;
            setRegId(uniqueId);
            setShowSuccess(true);
            setShowRegModal(false);
            setFaculty('');
            setStudentId('');
        } catch (err) {
            console.error(err);
            setFormError(err.message || 'Registration failed');
        } finally {
            setRegistering(false);
        }
    };

    const handleUnregister = async () => {
        try {
            const updatedEvent = await unregisterFromEvent(id, user?._id);
            if (!updatedEvent) {
                throw new Error('Unable to unregister from this event');
            }
            toast.success('Unregistered from event');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to unregister');
        }
    };

    const copyRegId = () => {
        navigator.clipboard.writeText(regId);
        toast.success('Registration ID copied!');
    };



    // Always render the hero section container to avoid layout shift
    // Use a fixed aspect ratio for the hero section (16:9)
    const HERO_ASPECT_RATIO = 'aspect-[16/9]';

    // Show skeleton loader for hero section while loading
    const showSkeleton = loading || detailLoading || !event;

    const statusColors = {
        upcoming: 'purple',
        ongoing: 'success',
        completed: 'default',
        cancelled: 'error',
    };




    // Use the same logic as EventsPage for event image
    const heroImage = event?.imageUrl ? `${BACKEND}${event.imageUrl}` : null;
    const fallbackImage = 'https://via.placeholder.com/800x300?text=No+Image';


    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back */}
            <button
                onClick={() => navigate('/events')}
                className="flex items-center gap-2 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark mb-6 cursor-pointer"
            >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back to Events</span>
            </button>

            {/* Event Hero Image Banner (Fixed aspect ratio, skeleton, overlay, hover) */}
            <div
                className={`relative w-full rounded-3xl overflow-hidden mb-6 group transition-all duration-300 ${HERO_ASPECT_RATIO}`}
                style={{ minHeight: 220, maxHeight: 500 }}
            >
                {showSkeleton ? (
                    <Skeleton className="w-full h-full" />
                ) : (
                    <>
                        {/* Image Layer */}
                        <img
                            src={heroImage || fallbackImage}
                            alt={event.title}
                            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = fallbackImage;
                            }}
                            style={{ minHeight: 220, maxHeight: 500 }}
                        />
                        {/* Overlay Layer */}
                        <div
                            className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-80"
                        />
                        {/* Status badge on image */}
                        <div className="absolute top-4 left-4 z-10">
                            <Badge variant={statusColors[event.status] || 'default'} className="text-sm">
                                {event.status}
                            </Badge>
                        </div>
                        {/* Content Layer: Title and date */}
                        <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow mb-1">
                                {event.title}
                            </h1>
                            <div className="flex items-center gap-2 text-white/90 text-sm">
                                <Clock size={16} className="text-accent-purple" />
                                {new Date(event.eventDate).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Event Header (rest of details) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-surface-dark-alt rounded-3xl card-shadow overflow-hidden mb-6"
            >
                <div className="p-6 md:p-8">
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

            {/* Registration Modal for student info */}
            <Modal
                isOpen={showRegModal}
                onClose={() => { setShowRegModal(false); setFormError(''); }}
                title="Complete Registration"
                size="sm"
            >
                <form onSubmit={handleRegSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-text-primary dark:text-text-dark mb-1.5">
                            Faculty
                        </label>
                        <select
                            value={faculty}
                            onChange={e => setFaculty(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                        >
                            <option value="">Select faculty</option>
                            {faculties.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Student ID Number"
                        value={studentId}
                        onChange={e => setStudentId(e.target.value)}
                        maxLength={10}
                        minLength={10}
                        pattern="[A-Za-z0-9]{10}"
                        placeholder="10 characters (letters & numbers)"
                        autoComplete="off"
                    />
                    {formError && <div className="text-error text-sm">{formError}</div>}
                    <Button
                        variant="gradient"
                        type="submit"
                        loading={registering}
                        className="w-full"
                    >
                        Register
                    </Button>
                </form>

            </Modal>

            {/* Registered Students (Admin Only) */}
            {isAdmin && (
                <Card hover={false} className="mb-6">
                    <h3 className="text-lg font-bold text-text-primary dark:text-text-dark mb-4">
                        Registered Students ({event?.attendees?.length || 0})
                    </h3>
                    {event?.attendees?.length > 0 ? (
                        <div className="space-y-3">
                            {event.attendees.map((student, index) => {
                                const safeStudent = typeof student === 'string'
                                    ? { _id: student, name: 'Unknown', email: '' }
                                    : student;
                                const key = safeStudent?._id || `student-${index}`;
                                const name = safeStudent?.name || 'Unknown';
                                const email = safeStudent?.email || 'Email not available';

                                return (
                                    <div
                                        key={key}
                                        className="flex items-center gap-3 p-3 rounded-xl
                                        bg-surface-alt dark:bg-surface-dark"
                                    >
                                        <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
                                            {name.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-primary dark:text-text-dark">
                                                {name}
                                            </p>
                                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                                {email}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            No students registered yet
                        </p>
                    )}
                </Card>
            )}

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
