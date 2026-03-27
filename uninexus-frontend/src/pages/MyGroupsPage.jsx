import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Users, ArrowLeft, Tag } from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Loader';

const MyGroupsPage = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyGroups = async () => {
            try {
                const res = await userAPI.getMyGroups();
                setGroups(res.data?.groups || []);
            } catch {
                setGroups([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMyGroups();
    }, []);

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
                        My <span className="gradient-text">Groups</span>
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
                        Groups you&apos;re a member of.
                    </p>
                </div>
                <Link to="/groups">
                    <Button variant="gradient">
                        <LayoutGrid size={16} />
                        Browse All Groups
                    </Button>
                </Link>
            </motion.div>

            {/* Groups Grid */}
            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white dark:bg-surface-dark-alt rounded-3xl p-6">
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-full mb-1" />
                            <Skeleton className="h-3 w-2/3 mb-4" />
                            <div className="flex gap-1">
                                <Skeleton className="h-5 w-12" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : groups.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => {
                        const isAdmin = group.admins?.some(
                            (a) => (typeof a === 'string' ? a : a._id) === user?._id
                        );
                        return (
                            <Link key={group._id} to={`/groups/${group._id}`}>
                                <Card className="h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-white">
                                            <LayoutGrid size={24} />
                                        </div>
                                        <div className="flex gap-1.5">
                                            <Badge variant="success">Member</Badge>
                                            {isAdmin && <Badge variant="purple">Admin</Badge>}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-text-primary dark:text-text-dark mb-1">
                                        {group.name}
                                    </h3>
                                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary line-clamp-2 mb-3 flex-1">
                                        {group.description || 'No description'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap gap-1">
                                            {group.tags?.slice(0, 2).map((tag) => (
                                                <Badge key={tag} variant="default" className="text-[10px]">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                        <span className="text-xs text-text-secondary dark:text-text-dark-secondary flex items-center gap-1">
                                            <Users size={12} />
                                            {group.members?.length || 0}
                                        </span>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <Card hover={false} className="text-center py-16">
                    <LayoutGrid size={48} className="mx-auto mb-4 text-text-secondary/30" />
                    <p className="text-lg font-semibold text-text-primary dark:text-text-dark mb-2">
                        You haven&apos;t joined any groups yet
                    </p>
                    <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
                        Explore and join groups that match your interests.
                    </p>
                    <Link to="/groups">
                        <Button variant="gradient">
                            <LayoutGrid size={16} />
                            Browse Groups
                        </Button>
                    </Link>
                </Card>
            )}
        </div>
    );
};

export default MyGroupsPage;
