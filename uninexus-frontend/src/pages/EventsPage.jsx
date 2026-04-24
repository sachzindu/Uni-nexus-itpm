import { useState, useEffect, useRef } from 'react';
import {
    Link, useNavigate, useLocation,
} from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, Plus, Calendar, MapPin, Users, Clock, Pencil, Trash2, Eye, Scan, Check, AlertCircle,
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../contexts/AuthContext';
import { useEventStore } from '../contexts/EventContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import EventForm from '../components/EventForm';
import { eventAPI } from '../services/api';

const getDeterministicRegId = (eventId, userId) => {
    if (!eventId || !userId) return '';
    const combined = `${eventId}-${userId}`;
    const eventPart = eventId.toString().slice(-4).toUpperCase();
    const userPart = userId.toString().slice(-4).toUpperCase();
    const hash = btoa(combined).substring(0, 4).toUpperCase();
    return `UNI-${eventPart}-${userPart}-${hash}`;
};

const EventsPage = () => {
    const { user } = useAuth();
    const {
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent,
        refreshEvents,
    } = useEventStore();
    const toast = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = user?.role === 'admin';
    const MotionDiv = motion.div;
    const MotionButton = motion.button;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);
    const [viewingEvent, setViewingEvent] = useState(null);
    // Admin: Registered Students modal state
    const [registeredStudents, setRegisteredStudents] = useState([]);
    const [showScanner, setShowScanner] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const scannerRef = useRef(null);

    // Admin: Fetch registered students for event
    const fetchRegisteredStudents = async (eventId) => {
        try {
            const data = await eventAPI.getAttendance(eventId);
            setRegisteredStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setRegisteredStudents([]);
        }
    };

    useEffect(() => {
        if (viewingEvent?._id) {
            fetchRegisteredStudents(viewingEvent._id);
        }
    }, [viewingEvent?.attendees?.length, viewingEvent?._id]);
    const [featuredEvent, setFeaturedEvent] = useState(null);
    const [featuredLoading, setFeaturedLoading] = useState(false);
    const lastErrorRef = useRef('');
    const safeEvents = Array.isArray(events) ? events : [];
    const BACKEND = import.meta.env.BACKEND_URL || 'http://localhost:3000';
    // Fetch featured event (with fallback to nearest upcoming if none)
    useEffect(() => {
        if (!isAdmin) {
            setFeaturedLoading(true);
            eventAPI.getFeatured()
                .then((res) => {
                    if (res?.data) {
                        setFeaturedEvent(res.data);
                    } else {
                        // Fallback: find nearest upcoming event
                        const upcoming = safeEvents
                            .filter((evt) => evt.status === 'upcoming' && new Date(evt.eventDate) > new Date())
                            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
                        setFeaturedEvent(upcoming[0] || null);
                    }
                })
                .catch(() => {
                    // On error, fallback to nearest upcoming event
                    const upcoming = safeEvents
                        .filter((evt) => evt.status === 'upcoming' && new Date(evt.eventDate) > new Date())
                        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
                    setFeaturedEvent(upcoming[0] || null);
                })
                .finally(() => setFeaturedLoading(false));
        }
    }, [isAdmin, safeEvents]);

    useEffect(() => {
        const openCreateFromQuery = new URLSearchParams(location.search).get('create') === 'true';
        if (isAdmin && openCreateFromQuery) {
            setShowCreate(true);
        }
    }, [isAdmin, location.search]);

    useEffect(() => {
        refreshEvents();
    }, [refreshEvents]);

    useEffect(() => {
        const message = error?.message || '';
        if (message && lastErrorRef.current !== message) {
            lastErrorRef.current = message;
            toast.error(message || 'Failed to load events');
        }
    }, [error, toast]);

    // QR Scanner Lifecycle
    useEffect(() => {
        if (showScanner) {
            scannerRef.current = new Html5QrcodeScanner(
                'reader',
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scannerRef.current.render(onScanSuccess, onScanFailure);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner:", error));
            }
        };
    }, [showScanner]);

    function onScanSuccess(decodedText) {
        if (scannerRef.current) {
            scannerRef.current.clear().then(() => {
                setShowScanner(false);
                verifyTicket(decodedText);
            });
        }
    }

    function onScanFailure() {
        // console.warn(`Code scan error = ${error}`);
    }

    const verifyTicket = (decodedText) => {
        try {
            if (!decodedText.startsWith('UNI-')) {
                setScanResult({
                    status: 'error',
                    message: 'Invalid QR Code format. Expected UNI-xxxx-xxxx-xxxx'
                });
                return;
            }

            let foundAttendee = null;
            let foundEvent = null;

            // Iterate through all events and their attendees to find a match
            for (const event of safeEvents) {
                if (!event.attendees) continue;
                
                for (const attendee of event.attendees) {
                    const aId = typeof attendee === 'string' ? attendee : attendee._id;
                    const targetRegId = getDeterministicRegId(event._id, aId);
                    
                    if (targetRegId === decodedText) {
                        foundAttendee = attendee;
                        foundEvent = event;
                        break;
                    }
                }
                if (foundAttendee) break;
            }

            if (foundAttendee && foundEvent) {
                setScanResult({
                    status: 'success',
                    student: typeof foundAttendee === 'string' ? { name: 'Registered Student', email: 'Verified' } : foundAttendee,
                    eventTitle: foundEvent.title
                });
            } else {
                setScanResult({
                    status: 'error',
                    message: 'No matching registration found for this QR code.'
                });
            }
        } catch {
            setScanResult({
                status: 'error',
                message: 'Failed to process QR code.'
            });
        }
    };

    const openCreateModal = () => {
        if (!isAdmin) return;
        setShowCreate(true);
    };

    const closeCreateModal = () => {
        setShowCreate(false);
        if (isAdmin && location.pathname.startsWith('/admin')) {
            const hasCreateQuery = new URLSearchParams(location.search).get('create') === 'true';
            if (hasCreateQuery) {
                navigate('/admin/events', { replace: true });
            }
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
    };

    const handleCreate = async (eventData) => {
        setCreating(true);
        try {
            await addEvent(eventData || {});
            await refreshEvents();
            toast.success('Event created!');
            closeCreateModal();
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to create event');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Delete this event? This action cannot be undone.')) return;
        setDeletingId(eventId);
        try {
            await deleteEvent(eventId);
            await refreshEvents();
            toast.success('Event deleted');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to delete event');
        } finally {
            setDeletingId('');
        }
    };

    const handleUpdateEvent = async (updatedData) => {
        try {
            if (!editingEvent?._id) return;
            await updateEvent(editingEvent._id, updatedData || {});
            await refreshEvents();
            toast.success('Event updated');
            setEditingEvent(null);
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to update event');
        }
    };

    const formatEventDate = (value) => {
        try {
            if (!value) return 'Date TBA';
            const parsedDate = new Date(value);
            if (Number.isNaN(parsedDate.getTime())) return 'Date TBA';
            return parsedDate.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch (err) {
            console.error(err);
            return 'Date TBA';
        }
    };

    const filteredEvents = safeEvents.filter((evt) => {
        const title = evt?.title?.toLowerCase?.() || '';
        const description = evt?.description?.toLowerCase?.() || '';
        const locationName = evt?.location?.toLowerCase?.() || '';
        const query = search.trim().toLowerCase();
        const matchesSearch = !query || title.includes(query) || description.includes(query) || locationName.includes(query);
        const matchesStatus = !statusFilter || evt?.status === statusFilter;
        const matchesCategory = !categoryFilter || evt?.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    const totalEvents = safeEvents.length;
    const totalRegistrations = safeEvents.reduce(
        (sum, evt) => sum + (evt?.attendees?.length || 0),
        0
    );
    const upcomingEvents = safeEvents.filter((evt) => evt?.status === 'upcoming').length;

    const statusColors = {
        upcoming: 'purple',
        ongoing: 'success',
        completed: 'default',
        cancelled: 'error',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            >
                <div>
                    <h1 className="text-3xl font-extrabold text-text-primary dark:text-text-dark">
                        Campus <span className="gradient-text">Events</span>
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
                        Discover workshops, meetups, and activities.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && location.pathname.startsWith('/admin') && (
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="gradient" 
                                onClick={() => setShowScanner(true)}
                                className="shadow-lg shadow-accent-purple/20"
                            >
                                <Scan size={18} />
                                Scan Ticket
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
                                Back to Admin
                            </Button>
                        </div>
                    )}
                    {isAdmin && (
                        <Button variant="gradient" onClick={openCreateModal}>
                            <Plus size={16} />
                            Create Event
                        </Button>
                    )}
                </div>
            </MotionDiv>

            {/* ── Featured Hero Banner — Student side only ── */}

            {/* ── Featured Hero Banner — Student side only ── */}
            {!isAdmin && (
                <div className="mb-8">
                    {/* Always render the container to prevent layout jump */}
                    <div
                        className="relative w-full rounded-3xl overflow-hidden group transition-all duration-300 aspect-[16/9] min-h-[220px] max-h-[500px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-purple"
                        style={{ minHeight: 220, maxHeight: 500 }}
                        tabIndex={0}
                        role="button"
                        aria-label={featuredEvent ? `View details for ${featuredEvent.title}` : 'Featured event'}
                        onClick={() => featuredEvent && navigate(`/events/${featuredEvent._id}`)}
                        onKeyDown={(e) => {
                            if (featuredEvent && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                navigate(`/events/${featuredEvent._id}`);
                            }
                        }}
                    >
                        {featuredLoading || !featuredEvent ? (
                            <Skeleton className="w-full h-full" />
                        ) : (
                            <>
                                {/* Image Layer */}
                                <img
                                    src={featuredEvent.imageUrl ? `${BACKEND}${featuredEvent.imageUrl}` : 'https://via.placeholder.com/800x300?text=No+Image'}
                                    alt={featuredEvent.title}
                                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/800x300?text=No+Image';
                                    }}
                                    style={{ minHeight: 220, maxHeight: 500 }}
                                />
                                {/* Overlay Layer */}
                                <div
                                    className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-80"
                                />
                                {/* Content Layer */}
                                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-accent-purple text-white">
                                            Featured
                                        </span>
                                        {featuredEvent.eventDate && (
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/15 backdrop-blur-sm text-white border border-white/20">
                                                🗓{' '}
                                                {new Date(featuredEvent.eventDate).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 leading-tight">
                                        {featuredEvent.title}
                                    </h2>
                                    <p className="text-sm text-white/75 line-clamp-2 mb-4 max-w-xl">
                                        {featuredEvent.description}
                                    </p>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span
                                            className="px-5 py-2.5 rounded-xl font-semibold text-sm gradient-bg text-white hover:opacity-90 transition-opacity cursor-pointer select-none"
                                        >
                                            {featuredEvent.status === 'upcoming' ? 'Grab Your Ticket' : 'View Details'}
                                        </span>
                                        {featuredEvent.location && (
                                            <span className="flex items-center gap-1.5 text-xs text-white/70">
                                                <MapPin size={13} />
                                                {featuredEvent.location}
                                            </span>
                                        )}
                                        {Array.isArray(featuredEvent.attendees) && (
                                            <span className="flex items-center gap-1.5 text-xs text-white/70">
                                                <Users size={13} />
                                                {featuredEvent.attendees.length} going
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Search & Filters */}

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark-alt border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    />
                </form>
                <div className="min-w-[180px]">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white dark:bg-surface-dark-alt border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    >
                        <option value="">All Events</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>


            {/* Enhanced Category filter row */}
            <div className="glass card-shadow rounded-2xl px-4 py-3 flex items-center gap-2 overflow-x-auto mt-2 mb-6 animate-slide-up relative">
                {[
                    { label: 'All Categories', value: '', icon: <Calendar size={16} className="text-accent-purple" /> },
                    { label: 'Academic', value: 'Academic', icon: <span role="img" aria-label="Academic">🎓</span> },
                    { label: 'Sports', value: 'Sports', icon: <span role="img" aria-label="Sports">🏅</span> },
                    { label: 'Cultural', value: 'Cultural', icon: <span role="img" aria-label="Cultural">🎭</span> },
                    { label: 'Workshop', value: 'Workshop', icon: <span role="img" aria-label="Workshop">🛠️</span> },
                    { label: 'Social', value: 'Social', icon: <span role="img" aria-label="Social">🤝</span> },
                    { label: 'Career', value: 'Career', icon: <span role="img" aria-label="Career">💼</span> },
                    { label: 'Other', value: 'Other', icon: <span role="img" aria-label="Other">✨</span> },
                ].map((cat) => (
                    <MotionButton
                        key={cat.value}
                        onClick={() => setCategoryFilter(cat.value)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-all cursor-pointer shadow-sm ${categoryFilter === cat.value ? 'gradient-bg text-white border-transparent animate-pulse-glow' : 'border-border dark:border-border-dark text-text-primary dark:text-text-dark bg-white/70 dark:bg-surface-dark-alt/80'}`}
                        style={{ minWidth: 0 }}
                    >
                        {cat.icon}
                        {cat.label}
                    </MotionButton>
                ))}
                {(categoryFilter || statusFilter || search) && (
                    <button
                        onClick={() => { setCategoryFilter(''); setStatusFilter(''); setSearch(''); }}
                        className="ml-2 px-3 py-2 rounded-xl text-sm font-semibold border border-accent-purple text-accent-purple bg-white/80 dark:bg-surface-dark-alt/80 hover:bg-accent-purple hover:text-white transition-colors"
                        style={{ minWidth: 0 }}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* No events found message */}
            {filteredEvents.length === 0 && (
                <div className="text-center text-text-secondary dark:text-text-dark-secondary py-12 text-lg">
                    No events found
                </div>
            )}

            {isAdmin && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <p className="text-base text-text-secondary dark:text-text-dark-secondary mb-2 font-semibold">
                            Total Events
                        </p>
                        <p className="text-4xl font-extrabold text-text-primary dark:text-text-dark">
                            {totalEvents}
                        </p>
                    </Card>
                    <Card>
                        <p className="text-base text-text-secondary dark:text-text-dark-secondary mb-2 font-semibold">
                            Total Registrations
                        </p>
                        <p className="text-4xl font-extrabold text-text-primary dark:text-text-dark">
                            {totalRegistrations}
                        </p>
                    </Card>
                    <Card>
                        <p className="text-base text-text-secondary dark:text-text-dark-secondary mb-2 font-semibold">
                            Upcoming Events
                        </p>
                        <p className="text-4xl font-extrabold text-text-primary dark:text-text-dark">
                            {upcomingEvents}
                        </p>
                    </Card>
                </div>
            )}

            {/* Events Grid */}
            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white dark:bg-surface-dark-alt rounded-3xl p-6">
                            <Skeleton className="h-5 w-3/4 mb-3" />
                            <Skeleton className="h-3 w-full mb-1" />
                            <Skeleton className="h-3 w-2/3 mb-4" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    ))}
                </div>
            ) : filteredEvents.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((evt, index) => {
                        const eventId = evt?._id || `event-${index}`;
                        const attendees = Array.isArray(evt?.attendees) ? evt.attendees : [];
                        const isRegistered = !isAdmin && attendees.some(
                            (a) => (typeof a === 'string' ? a : a._id) === user?._id
                        );
                        const eventDate = formatEventDate(evt?.eventDate);

                        const cardContent = (
    <Card className="h-full flex flex-col overflow-hidden p-0">
        {/* Image / Banner */}
        <div className="relative w-full h-44 flex-shrink-0">
            {evt?.imageUrl ? (
                <img
                    src={`${BACKEND}${evt.imageUrl}`}
                    alt={evt?.title}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full gradient-bg" />
            )}

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Category badge — top left */}
            {evt?.category && evt.category !== 'Other' && (
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm text-white border border-white/30">
                    {evt.category}
                </span>
            )}

            {/* Status badge — top right */}
            <div className="absolute top-3 right-3">
                <Badge variant={statusColors[evt?.status] || 'default'}>
                    {evt?.status || 'unknown'}
                </Badge>
            </div>

            {/* Date overlay — bottom left */}
            {evt?.eventDate && (
                <div className="absolute bottom-3 left-3 bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-white">
                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                        {new Date(evt.eventDate).toLocaleString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-extrabold leading-none">
                        {new Date(evt.eventDate).getDate()}
                    </p>
                </div>
            )}

            {/* Registered badge — bottom right */}
            {isRegistered && (
                <div className="absolute bottom-3 right-3">
                    <Badge variant="success">Registered</Badge>
                </div>
            )}
        </div>

        {/* Card Body */}
        <div className="flex flex-col flex-1 p-4">
            <h3 className="font-bold text-text-primary dark:text-text-dark mb-1 line-clamp-1">
                {evt?.title || 'Untitled event'}
            </h3>
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary line-clamp-2 mb-3 flex-1">
                {evt?.description || 'No description'}
            </p>

            <div className="space-y-2 text-base font-medium text-text-secondary dark:text-text-dark-secondary mb-3">
                <div className="flex items-center gap-2">
                    <Clock size={18} className="text-accent-purple flex-shrink-0" />
                    <span className="truncate tracking-wide">{eventDate}</span>
                </div>
                <div className="flex items-center gap-2 justify-between w-full">
                    {evt?.location && (
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-accent-orange flex-shrink-0" />
                            <span className="truncate tracking-wide">{evt.location}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <Users size={16} className="text-success flex-shrink-0" />
                        <span className="font-semibold">{evt?.attendees?.length || 0} </span>
                    </div>
                </div>
            </div>

            {/* Admin buttons */}
            {isAdmin && (
                <div className="grid grid-cols-3 gap-2 mt-auto pt-2 border-t border-border dark:border-border-dark">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingEvent(evt)}
                    >
                        <Pencil size={14} />
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                            setViewingEvent(evt);
                            if (isAdmin && evt?._id) {
                                await fetchRegisteredStudents(evt._id);
                            }
                        }}
                    >
                        <Eye size={14} />
                        View
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        loading={deletingId === eventId}
                        onClick={() => handleDelete(eventId)}
                    >
                        <Trash2 size={14} />
                        Delete
                    </Button>
                </div>
            )}
        </div>
    </Card>
);

                        if (isAdmin) {
                            return (
                                <div key={eventId}>
                                    {cardContent}
                                </div>
                            );
                        }

                        return (
                            <Link key={eventId} to={`/events/${eventId}`}>
                                {cardContent}
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <Card hover={false} className="text-center py-16">
                    <Calendar size={48} className="mx-auto mb-4 text-text-secondary/30" />
                    <p className="text-text-secondary dark:text-text-dark-secondary">No events found.</p>
                </Card>
            )}

            {/* Create Modal */}
            <Modal isOpen={isAdmin && showCreate} onClose={closeCreateModal} title="Create New Event" size="lg">
                <EventForm
                    initialData={{}}
                    onSubmit={handleCreate}
                    loading={creating}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isAdmin && !!editingEvent}
                onClose={() => setEditingEvent(null)}
                title="Edit Event"
                size="lg"
            >
                <EventForm
                    key={editingEvent?._id || 'edit-event'}
                    initialData={editingEvent || {}}
                    onSubmit={handleUpdateEvent}
                    loading={false}
                />
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={!!viewingEvent}
                onClose={() => {
                    setViewingEvent(null);
                }}
                title={viewingEvent?.title || 'Event Details'}
                size="md"
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Description</p>
                        <p className="text-sm text-text-primary dark:text-text-dark">
                            {viewingEvent?.description || 'No description'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Date</p>
                            <p className="text-sm text-text-primary dark:text-text-dark">
                                {formatEventDate(viewingEvent?.eventDate)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Location</p>
                            <p className="text-sm text-text-primary dark:text-text-dark">
                                {viewingEvent?.location || 'TBA'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Attendees</p>
                            <p className="text-sm text-text-primary dark:text-text-dark">
                                {Array.isArray(viewingEvent?.attendees) ? viewingEvent.attendees.length : 0}
                                {viewingEvent?.maxAttendees ? ` / ${viewingEvent.maxAttendees}` : ''}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Status</p>
                            <p className="text-sm text-text-primary dark:text-text-dark">
                                {viewingEvent?.status || 'upcoming'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Category</p>
                        <p className="text-sm text-text-primary dark:text-text-dark">
                            {viewingEvent?.category || 'Other'}
                        </p>
                    </div>
                    {Array.isArray(viewingEvent?.tags) && viewingEvent.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {viewingEvent.tags.map((tag) => (
                                <Badge key={tag} variant="purple" className="text-[10px]">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                    {/* Admin: Show Registered Students button and list */}
                    {isAdmin && viewingEvent?._id && (
                        <div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <Button
                                    variant="outline"
                                    className="bg-accent-purple text-white hover:bg-accent-purple/90"
                                    onClick={() => {
                                        // Download CSV of registered students
                                        const csvRows = [
                                            ['Student ID', 'Faculty'],
                                            ...registeredStudents.map(s => [s.studentId, s.faculty])
                                        ];
                                        const csvContent = csvRows.map(row => row.map(field => `"${(field ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
                                        const blob = new Blob([csvContent], { type: 'text/csv' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `registered_students_${viewingEvent?._id || 'event'}.csv`;
                                        document.body.appendChild(a);
                                        a.click();
                                        setTimeout(() => {
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }, 100);
                                    }}
                                    disabled={!registeredStudents || registeredStudents.length === 0}
                                >
                                    Download Registered Students
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button variant="ghost" onClick={() => setViewingEvent(null)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Scanner Modal */}
            <Modal
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                title="Scan Registration QR"
                size="sm"
            >
                <div className="space-y-4">
                    <div id="reader" className="overflow-hidden rounded-2xl border-2 border-dashed border-border dark:border-border-dark"></div>
                    <p className="text-center text-xs text-text-secondary px-4">
                        Position the student's registration QR code within the frame to verify.
                    </p>
                    <Button variant="outline" onClick={() => setShowScanner(false)} className="w-full">
                        Cancel
                    </Button>
                </div>
            </Modal>

            {/* Scan Result Modal */}
            <Modal
                isOpen={!!scanResult}
                onClose={() => setScanResult(null)}
                title={scanResult?.status === 'success' ? "Verification Successful" : "Verification Failed"}
                size="sm"
            >
                <div className="text-center space-y-6 py-4">
                    {scanResult?.status === 'success' ? (
                        <>
                            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                                <Check size={40} className="text-success" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-text-primary dark:text-text-dark">
                                    {scanResult.student.name}
                                </h4>
                                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                                    Registered for: {scanResult.eventTitle}
                                </p>
                                <Badge variant="success" className="mx-auto mt-2 px-4 py-1.5">
                                    Verified Attendee
                                </Badge>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 mx-auto rounded-full bg-error/10 flex items-center justify-center">
                                <AlertCircle size={40} className="text-error" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-text-primary dark:text-text-dark">
                                    Access Denied
                                </h4>
                                <p className="text-sm text-text-secondary dark:text-text-dark-secondary px-4 leading-relaxed">
                                    {scanResult?.message}
                                </p>
                            </div>
                        </>
                    )}

                    <Button 
                        variant={scanResult?.status === 'success' ? 'gradient' : 'default'} 
                        onClick={() => setScanResult(null)} 
                        className="w-full h-12 rounded-2xl"
                    >
                        Close
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default EventsPage;
