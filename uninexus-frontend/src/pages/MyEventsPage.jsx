import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ArrowLeft } from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Loader';

const MyEventsPage = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                const res = await userAPI.getMyEvents();
                setEvents(res.data?.events || []);
            } catch {
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMyEvents();
    }, []);

    const statusColors = {
        upcoming: 'purple',
        ongoing: 'success',
        completed: 'default',
        cancelled: 'error',
    };

    // Partition events into upcoming and past for a better UX
    const now = new Date();
    const upcomingEvents = events.filter((evt) => new Date(evt.eventDate) >= now);
    const pastEvents = events.filter((evt) => new Date(evt.eventDate) < now);

    const renderEventCard = (evt) => {
        const isOrganizer = (typeof evt.organizer === 'string' ? evt.organizer : evt.organizer?._id) === user?._id;
        return (
            <Link key={evt._id} to={`/events/${evt._id}`}>
                <Card className="h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                        <Badge variant={statusColors[evt.status] || 'default'}>
                            {evt.status}
                        </Badge>
                        <div className="flex gap-1.5">
                            <Badge variant="success">Registered</Badge>
                            {isOrganizer && <Badge variant="purple">Organizer</Badge>}
                        </div>
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
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1.5 text-sm text-text-secondary dark:text-text-dark-secondary hover:text-accent-purple transition-colors mb-3"
                    >
                        <ArrowLeft size={14} />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-extrabold text-text-primary dark:text-text-dark">
                        My <span className="gradient-text">Events</span>
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
                        Events you&apos;re registered for.
                    </p>
                </div>
                <Link to="/events">
                    <Button variant="gradient">
                        <Calendar size={16} />
                        Browse All Events
                    </Button>
                </Link>
            </motion.div>

            {/* Content */}
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
                <div className="space-y-8">
                    {/* Upcoming Events Section */}
                    {upcomingEvents.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-text-primary dark:text-text-dark flex items-center gap-2 mb-4">
                                <Calendar size={18} className="text-accent-purple" />
                                Upcoming Events
                                <span className="text-sm font-normal text-text-secondary dark:text-text-dark-secondary">
                                    ({upcomingEvents.length})
                                </span>
                            </h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcomingEvents.map(renderEventCard)}
                            </div>
                        </div>
                    )}

                    {/* Past Events Section */}
                    {pastEvents.length > 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-text-primary dark:text-text-dark flex items-center gap-2 mb-4">
                                <Clock size={18} className="text-text-secondary" />
                                Past Events
                                <span className="text-sm font-normal text-text-secondary dark:text-text-dark-secondary">
                                    ({pastEvents.length})
                                </span>
                            </h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                                {pastEvents.map(renderEventCard)}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <Card hover={false} className="text-center py-16">
                    <Calendar size={48} className="mx-auto mb-4 text-text-secondary/30" />
                    <p className="text-lg font-semibold text-text-primary dark:text-text-dark mb-2">
                        You haven&apos;t registered for any events yet
                    </p>
                    <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
                        Discover workshops, meetups, and activities on campus.
                    </p>
                    <Link to="/events">
                        <Button variant="gradient">
                            <Calendar size={16} />
                            Browse Events
                        </Button>
                    </Link>
                </Card>
            )}
        </div>
    );
};

export default MyEventsPage;
