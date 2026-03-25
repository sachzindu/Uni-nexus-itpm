import { useState, useEffect, useRef } from 'react';
import {
    Link, useNavigate, useLocation,
} from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, Plus, Calendar, MapPin, Users, Clock, Pencil, Trash2, Eye,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEventStore } from '../contexts/EventContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Loader';
import EventForm from '../components/EventForm';

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
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);
    const [viewingEvent, setViewingEvent] = useState(null);
    const lastErrorRef = useRef('');
    const safeEvents = Array.isArray(events) ? events : [];
    const BACKEND = import.meta.env.BACKEND_URL || 'http://localhost:3000';

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
        console.log('Fetched events:', safeEvents);
    }, [safeEvents]);

    useEffect(() => {
        console.log('User:', user);
    }, [user]);

    useEffect(() => {
        const message = error?.message || '';
        if (message && lastErrorRef.current !== message) {
            lastErrorRef.current = message;
            toast.error(message || 'Failed to load events');
        }
    }, [error, toast]);

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
            <motion.div
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
                        <Button variant="secondary" onClick={() => navigate('/admin/dashboard')}>
                            Back to Admin
                        </Button>
                    )}
                    {isAdmin && (
                        <Button variant="gradient" onClick={openCreateModal}>
                            <Plus size={16} />
                            Create Event
                        </Button>
                    )}
                </div>
            </motion.div>

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
                <div className="flex gap-2 overflow-x-auto">
                    {['', 'upcoming', 'ongoing', 'completed', 'cancelled'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border
                transition-all cursor-pointer ${statusFilter === s
                                    ? 'gradient-bg text-white border-transparent'
                                    : 'border-border dark:border-border-dark text-text-primary dark:text-text-dark'
                                }`}
                        >
                            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category filter row */}
            <div className="flex gap-2 overflow-x-auto mt-2">
                {['', 'Academic', 'Sports', 'Cultural', 'Workshop', 'Social', 'Career', 'Other'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border
                            transition-all cursor-pointer ${
                            categoryFilter === cat
                                ? 'gradient-bg text-white border-transparent'
                                : 'border-border dark:border-border-dark text-text-primary dark:text-text-dark'
                            }`}
                    >
                        {cat || 'All Categories'}
                    </button>
                ))}
            </div>

            {isAdmin && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-1">
                            Total Events
                        </p>
                        <p className="text-2xl font-extrabold text-text-primary dark:text-text-dark">
                            {totalEvents}
                        </p>
                    </Card>
                    <Card>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-1">
                            Total Registrations
                        </p>
                        <p className="text-2xl font-extrabold text-text-primary dark:text-text-dark">
                            {totalRegistrations}
                        </p>
                    </Card>
                    <Card>
                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-1">
                            Upcoming Events
                        </p>
                        <p className="text-2xl font-extrabold text-text-primary dark:text-text-dark">
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

            <div className="space-y-1.5 text-xs text-text-secondary dark:text-text-dark-secondary mb-3">
                <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-accent-purple flex-shrink-0" />
                    <span className="truncate">{eventDate}</span>
                </div>
                {evt?.location && (
                    <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-accent-orange flex-shrink-0" />
                        <span className="truncate">{evt.location}</span>
                    </div>
                )}
                {isAdmin && (
                    <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-success flex-shrink-0" />
                        <span>
                            {evt?.attendees?.length || 0}
                            {evt?.maxAttendees ? ` / ${evt.maxAttendees}` : ''} attendees
                        </span>
                    </div>
                )}
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
                        onClick={() => setViewingEvent(evt)}
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
                onClose={() => setViewingEvent(null)}
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
                    <div className="flex justify-end">
                        <Button variant="ghost" onClick={() => setViewingEvent(null)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EventsPage;
