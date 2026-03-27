import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users,
    Calendar,
    LayoutGrid,
    Sparkles,
    ArrowRight,
    TrendingUp,
    Clock,
    Heart,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, groupAPI, eventAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Loader';
import UserAvatar from '../components/ui/UserAvatar';

const DashboardPage = () => {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [events, setEvents] = useState([]);
    const [featuredEvent, setFeaturedEvent] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [recRes, evtRes, grpRes, featRes] = await Promise.allSettled([
                    userAPI.getRecommendations(6),
                    eventAPI.getAll({ upcoming: 'true', limit: 4 }),
                    groupAPI.getAll({ limit: 4 }),
                    eventAPI.getFeatured(),
                ]);

                if (recRes.status === 'fulfilled') {
                    const data = recRes.value?.data;
                    setRecommendations(
                        data?.type === 'users' ? data.recommendations : []
                    );
                }
                if (evtRes.status === 'fulfilled') {
                    setEvents(evtRes.value?.data?.events || []);
                }
                if (grpRes.status === 'fulfilled') {
                    setGroups(grpRes.value?.data?.groups || []);
                }
                if (featRes.status === 'fulfilled') {
                    setFeaturedEvent(featRes.value?.data || null);
                }
            } catch {
                // Silently handle errors for dashboard
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl gradient-bg p-8 mb-8"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-16 -mb-16" />
                <div className="relative">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
                        Welcome back, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-white/80 text-lg">
                        Discover new connections and stay updated with your campus community.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6">
                        <Link to="/discover">
                            <Button variant="secondary" size="sm">
                                <Users size={16} />
                                Find Friends
                            </Button>
                        </Link>
                        <Link to="/friends">
                            <Button variant="secondary" size="sm">
                                <Heart size={16} />
                                Show Friends
                            </Button>
                        </Link>
                        <Link to="/groups">
                            <Button variant="secondary" size="sm">
                                <LayoutGrid size={16} />
                                Browse Groups
                            </Button>
                        </Link>
                        <Link to="/events">
                            <Button variant="secondary" size="sm">
                                <Calendar size={16} />
                                Explore Events
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'My Groups', value: user?.groups?.length || 0, icon: LayoutGrid, color: 'text-accent-purple', to: '/dashboard/my-groups' },
                    { label: 'My Events', value: user?.events?.length || 0, icon: Calendar, color: 'text-accent-orange', to: '/dashboard/my-events' },
                    { label: 'Interests', value: user?.interests?.length || 0, icon: Sparkles, color: 'text-success', to: null },
                    { label: 'Matches', value: recommendations.length, icon: TrendingUp, color: 'text-blue-500', to: null },
                ].map(({ label, value, icon: Icon, color, to }) => {
                    const cardContent = (
                        <Card key={label} hover={!!to} className={`text-center ${to ? 'cursor-pointer' : ''}`}>
                            <Icon size={24} className={`mx-auto mb-2 ${color}`} />
                            <p className="text-2xl font-bold text-text-primary dark:text-text-dark">
                                {value}
                            </p>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                {label}
                            </p>
                            {to && (
                                <p className="text-[10px] text-accent-purple mt-1 font-medium">
                                    View all →
                                </p>
                            )}
                        </Card>
                    );

                    return to ? (
                        <Link key={label} to={to}>
                            {cardContent}
                        </Link>
                    ) : (
                        <div key={label}>{cardContent}</div>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recommendations */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-text-primary dark:text-text-dark flex items-center gap-2">
                            <Sparkles size={20} className="text-accent-purple" />
                            Recommended for You
                        </h2>
                        <Link
                            to="/dashboard/discovermatches"
                            className="text-sm font-medium text-accent-purple hover:underline flex items-center gap-1"
                        >
                            See all <ArrowRight size={14} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-white dark:bg-surface-dark-alt rounded-3xl p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Skeleton className="w-10 h-10" rounded />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-24 mb-1" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-3 w-full mb-2" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            ))}
                        </div>
                    ) : recommendations.length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {recommendations.map((rec) => (
                                <Card key={rec._id} className="flex flex-col">
                                    <div className="flex items-center gap-3 mb-3">
                                        <UserAvatar user={rec} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-text-primary dark:text-text-dark truncate">
                                                {rec.name}
                                            </p>
                                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                                {rec.department} • Year {rec.year}
                                            </p>
                                        </div>
                                        {rec.similarityScore && (
                                            <Badge variant="purple" className="text-[10px]">
                                                {Math.round(rec.similarityScore * 100)}% match
                                            </Badge>
                                        )}
                                    </div>
                                    {rec.bio && (
                                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary line-clamp-2 mb-3">
                                            {rec.bio}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-1 mt-auto">
                                        {rec.interests?.slice(0, 3).map((int) => (
                                            <Badge key={int} variant="default" className="text-[10px]">
                                                {int}
                                            </Badge>
                                        ))}
                                        {rec.interests?.length > 3 && (
                                            <Badge variant="default" className="text-[10px]">
                                                +{rec.interests.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card hover={false} className="text-center py-12">
                            <Sparkles size={48} className="mx-auto mb-4 text-accent-purple/30" />
                            <p className="text-text-secondary dark:text-text-dark-secondary">
                                Complete your profile interests to get personalized recommendations!
                            </p>
                            <Link to="/onboarding" className="inline-block mt-4">
                                <Button variant="gradient" size="sm">
                                    Set Up Interests
                                </Button>
                            </Link>
                        </Card>
                    )}
                </div>

                {/* Sidebar: Events & Groups */}
                <div className="space-y-8">
                    {/* Featured Event */}
                    {featuredEvent && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-accent-orange flex items-center gap-2">
                                    <Sparkles size={18} className="text-accent-orange" />
                                    Featured Event
                                </h2>
                                <Link to={`/events/${featuredEvent._id}`} className="text-sm font-medium text-accent-purple hover:underline">
                                    View
                                </Link>
                            </div>
                            <Card className="!p-4 mb-4 gradient-bg text-white">
                                <div className="mb-2">
                                    <p className="font-semibold text-base mb-1">{featuredEvent.title}</p>
                                    <div className="flex items-center gap-2 text-xs opacity-80">
                                        <Clock size={12} />
                                        {new Date(featuredEvent.eventDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                    <div className="text-xs opacity-80 mt-1">
                                        {featuredEvent.location}
                                    </div>
                                </div>
                                <div className="text-xs opacity-90 line-clamp-3 mb-1">
                                    {featuredEvent.description}
                                </div>
                            </Card>
                        </div>
                    )}
                    {/* Upcoming Events */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-text-primary dark:text-text-dark flex items-center gap-2">
                                <Calendar size={18} className="text-accent-orange" />
                                Upcoming Events
                            </h2>
                            <Link
                                to="/events"
                                className="text-sm font-medium text-accent-purple hover:underline"
                            >
                                All
                            </Link>
                        </div>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-white dark:bg-surface-dark-alt rounded-2xl p-4">
                                        <Skeleton className="h-4 w-3/4 mb-2" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : events.length > 0 ? (
                            <div className="space-y-3">
                                {events
                                    .filter(evt => !featuredEvent || evt._id !== featuredEvent._id)
                                    .slice(0, 2)
                                    .map((evt) => (
                                        <Link key={evt._id} to={`/events/${evt._id}`}>
                                            <Card className="!p-4 mb-3">
                                                <p className="font-semibold text-sm text-text-primary dark:text-text-dark mb-1">
                                                    {evt.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-text-dark-secondary">
                                                    <Clock size={12} />
                                                    {new Date(evt.eventDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </Card>
                                        </Link>
                                    ))}
                            </div>
                        ) : (
                            <Card hover={false} className="text-center py-8 !p-4">
                                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                                    No upcoming events
                                </p>
                            </Card>
                        )}
                    </div>

                    {/* My Groups */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-text-primary dark:text-text-dark flex items-center gap-2">
                                <LayoutGrid size={18} className="text-success" />
                                Popular Groups
                            </h2>
                            <Link
                                to="/groups"
                                className="text-sm font-medium text-accent-purple hover:underline"
                            >
                                All
                            </Link>
                        </div>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="bg-white dark:bg-surface-dark-alt rounded-2xl p-4">
                                        <Skeleton className="h-4 w-3/4 mb-2" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : groups.length > 0 ? (
                            <div className="space-y-3">
                                {groups.map((grp) => (
                                    <Link key={grp._id} to={`/groups/${grp._id}`}>
                                        <Card className="!p-4 mb-3">
                                            <p className="font-semibold text-sm text-text-primary dark:text-text-dark mb-1">
                                                {grp.name}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-text-dark-secondary">
                                                <Users size={12} />
                                                {grp.members?.length || 0} members
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <Card hover={false} className="text-center py-8 !p-4">
                                <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                                    No groups yet
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
