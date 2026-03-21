import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, Plus, Calendar, MapPin, Users, Clock, Filter,
} from 'lucide-react';
import { eventAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Skeleton } from '../components/ui/Loader';

const EventsPage = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '', description: '', eventDate: '', location: '',
        maxAttendees: '', tags: '',
    });

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await eventAPI.getAll(params);
            setEvents(res.data?.events || []);
        } catch {
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [statusFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchEvents();
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.title.trim() || !createForm.eventDate) return;
        setCreating(true);
        try {
            await eventAPI.create({
                title: createForm.title.trim(),
                description: createForm.description.trim(),
                eventDate: createForm.eventDate,
                location: createForm.location.trim(),
                maxAttendees: createForm.maxAttendees ? parseInt(createForm.maxAttendees) : undefined,
                tags: createForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
            });
            toast.success('Event created!');
            setShowCreate(false);
            setCreateForm({ title: '', description: '', eventDate: '', location: '', maxAttendees: '', tags: '' });
            fetchEvents();
        } catch (err) {
            toast.error(err.message || 'Failed to create event');
        } finally {
            setCreating(false);
        }
    };

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
                <Button variant="gradient" onClick={() => setShowCreate(true)}>
                    <Plus size={16} />
                    Create Event
                </Button>
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
            ) : events.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((evt) => {
                        const isRegistered = evt.attendees?.some(
                            (a) => (typeof a === 'string' ? a : a._id) === user?._id
                        );
                        return (
                            <Link key={evt._id} to={`/events/${evt._id}`}>
                                <Card className="h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge variant={statusColors[evt.status] || 'default'}>
                                            {evt.status}
                                        </Badge>
                                        {isRegistered && <Badge variant="success">Registered</Badge>}
                                    </div>
                                    <h3 className="font-bold text-text-primary dark:text-text-dark mb-1">
                                        {evt.title}
                                    </h3>
                                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary line-clamp-2 mb-3 flex-1">
                                        {evt.description || 'No description'}
                                    </p>
                                    <div className="space-y-1.5 text-xs text-text-secondary dark:text-text-dark-secondary">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {new Date(evt.eventDate).toLocaleDateString('en-US', {
                                                weekday: 'short', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </div>
                                        {evt.location && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={12} />
                                                {evt.location}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Users size={12} />
                                            {evt.attendees?.length || 0}
                                            {evt.maxAttendees ? ` / ${evt.maxAttendees}` : ''} attendees
                                        </div>
                                    </div>
                                </Card>
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
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Event" size="lg">
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                        label="Event Title"
                        placeholder="e.g., Intro to React Workshop"
                        value={createForm.title}
                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-text-primary dark:text-text-dark">Description</label>
                        <textarea
                            placeholder="What's the event about?"
                            value={createForm.description}
                            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Event Date & Time"
                            type="datetime-local"
                            value={createForm.eventDate}
                            onChange={(e) => setCreateForm({ ...createForm, eventDate: e.target.value })}
                        />
                        <Input
                            label="Location"
                            placeholder="e.g., Room 301, Main Building"
                            value={createForm.location}
                            onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Max Attendees (optional)"
                            type="number"
                            placeholder="e.g., 50"
                            value={createForm.maxAttendees}
                            onChange={(e) => setCreateForm({ ...createForm, maxAttendees: e.target.value })}
                        />
                        <Input
                            label="Tags (comma-separated)"
                            placeholder="e.g., react, workshop"
                            value={createForm.tags}
                            onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button type="submit" variant="gradient" loading={creating}>Create Event</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EventsPage;
