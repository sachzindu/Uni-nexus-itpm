import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Users, X, Eye } from 'lucide-react';
import { userAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Loader';
import UserAvatar from '../components/ui/UserAvatar';

const departments = [
    'All', 'Computer Science', 'Engineering', 'Business', 'Arts & Design',
    'Medicine', 'Law', 'Sciences', 'Education', 'Social Sciences', 'Architecture',
];

const DiscoverPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ department: 'All', year: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch top recommended users instead of paginated all users
            const res = await userAPI.getRecommendations(50);
            let recUsers = res.data.recommendations || [];

            // Apply local filtering since recommendations API doesn't support them natively
            if (search) {
                const lowerSearch = search.toLowerCase();
                recUsers = recUsers.filter(u =>
                    u.name?.toLowerCase().includes(lowerSearch) ||
                    u.email?.toLowerCase().includes(lowerSearch)
                );
            }
            if (filters.department && filters.department !== 'All') {
                recUsers = recUsers.filter(u =>
                    u.department?.toLowerCase() === filters.department.toLowerCase()
                );
            }
            if (filters.year) {
                recUsers = recUsers.filter(u =>
                    u.year === parseInt(filters.year, 10) || String(u.year) === filters.year
                );
            }

            setUsers(recUsers);
            setPagination({ page: 1, pages: 1, total: recUsers.length });
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(1);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-extrabold text-text-primary dark:text-text-dark">
                    Discover <span className="gradient-text">friends</span>
                </h1>
                <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
                    Find and connect with students across your campus.
                </p>
            </motion.div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                    />
                    <input
                        type="text"
                        placeholder="Search students by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark-alt
              border border-border dark:border-border-dark rounded-xl
              text-text-primary dark:text-text-dark
              focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    />
                </form>
                <Button
                    variant="secondary"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={16} />
                    Filters
                    {(filters.department !== 'All' || filters.year) && (
                        <span className="w-2 h-2 rounded-full bg-accent-purple" />
                    )}
                </Button>
            </div>

            {/* Filters panel */}
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 p-4 bg-white dark:bg-surface-dark-alt rounded-2xl card-shadow"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm text-text-primary dark:text-text-dark">
                            Filters
                        </h3>
                        <button
                            onClick={() => {
                                setFilters({ department: 'All', year: '' });
                                setSearch('');
                            }}
                            className="text-xs text-accent-purple hover:underline cursor-pointer"
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary mb-2 block">
                                Department
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {departments.map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setFilters({ ...filters, department: d })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${filters.department === d
                                            ? 'gradient-bg text-white border-transparent'
                                            : 'border-border dark:border-border-dark text-text-primary dark:text-text-dark hover:border-accent-purple'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary mb-2 block">
                                Year of Study
                            </label>
                            <div className="flex gap-2">
                                {['', '1', '2', '3', '4'].map((y) => (
                                    <button
                                        key={y}
                                        onClick={() => setFilters({ ...filters, year: y })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${filters.year === y
                                            ? 'gradient-bg text-white border-transparent'
                                            : 'border-border dark:border-border-dark text-text-primary dark:text-text-dark hover:border-accent-purple'
                                            }`}
                                    >
                                        {y || 'All'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Results count */}
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                {pagination.total} student{pagination.total !== 1 ? 's' : ''} found
            </p>

            {/* Student Grid */}
            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }, (_, i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-surface-dark-alt rounded-3xl p-6"
                        >
                            <div className="flex justify-center mb-4">
                                <Skeleton className="w-16 h-16" rounded />
                            </div>
                            <Skeleton className="h-4 w-24 mx-auto mb-2" />
                            <Skeleton className="h-3 w-20 mx-auto mb-4" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    ))}
                </div>
            ) : users.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {users.map((student) => {
                        const matchPercent = student.similarityScore != null
                            ? Math.round(student.similarityScore * 100)
                            : null;

                        // Color tiers based on match strength
                        let ringColor = 'from-blue-400 to-indigo-500';
                        let textColor = 'text-blue-600 dark:text-blue-400';
                        let bgGlow = 'bg-blue-500/10';
                        if (matchPercent != null) {
                            if (matchPercent >= 75) {
                                ringColor = 'from-emerald-400 to-green-500';
                                textColor = 'text-emerald-600 dark:text-emerald-400';
                                bgGlow = 'bg-emerald-500/10';
                            } else if (matchPercent >= 50) {
                                ringColor = 'from-amber-400 to-orange-500';
                                textColor = 'text-amber-600 dark:text-amber-400';
                                bgGlow = 'bg-amber-500/10';
                            } else if (matchPercent >= 25) {
                                ringColor = 'from-violet-400 to-purple-500';
                                textColor = 'text-violet-600 dark:text-violet-400';
                                bgGlow = 'bg-violet-500/10';
                            }
                        }

                        return (
                            <Card key={student._id} className="text-center relative overflow-visible">
                                {/* Match percentage badge */}
                                {matchPercent != null && (
                                    <div className="absolute -top-3 -right-3 z-10">
                                        <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${ringColor} p-[2px] shadow-lg`}>
                                            <div className={`w-full h-full rounded-full bg-white dark:bg-surface-dark-alt flex items-center justify-center ${bgGlow}`}>
                                                <span className={`text-xs font-bold ${textColor}`}>
                                                    {matchPercent}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <UserAvatar user={student} size="lg" className="mx-auto mb-3" />
                                <h3 className="font-semibold text-text-primary dark:text-text-dark">
                                    {student.name}
                                </h3>
                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-0.5">
                                    {student.department || 'Department not set'} {student.year ? `• Year ${student.year}` : ''}
                                </p>

                                {/* Match bar indicator */}
                                {matchPercent != null && (
                                    <div className="mt-2 px-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-medium text-text-secondary dark:text-text-dark-secondary">
                                                Match
                                            </span>
                                            <span className={`text-[10px] font-bold ${textColor}`}>
                                                {matchPercent}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full bg-gradient-to-r ${ringColor}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${matchPercent}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {student.bio && (
                                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-2 line-clamp-2">
                                        {student.bio}
                                    </p>
                                )}
                                <div className="flex flex-wrap justify-center gap-1 mt-3">
                                    {student.interests?.slice(0, 3).map((int) => (
                                        <Badge key={int} variant="default" className="text-[10px]">
                                            {int}
                                        </Badge>
                                    ))}
                                    {student.interests?.length > 3 && (
                                        <Badge variant="purple" className="text-[10px]">
                                            +{student.interests.length - 3}
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    variant="gradient"
                                    size="sm"
                                    className="mt-4 w-full"
                                    onClick={() => navigate(`/students/${student._id}`)}
                                >
                                    <Eye size={14} />
                                    View Profile
                                </Button>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card hover={false} className="text-center py-16">
                    <Users size={48} className="mx-auto mb-4 text-text-secondary/30" />
                    <p className="text-text-secondary dark:text-text-dark-secondary">
                        No students found matching your criteria.
                    </p>
                </Card>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: pagination.pages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => fetchUsers(i + 1)}
                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-all cursor-pointer ${pagination.page === i + 1
                                ? 'gradient-bg text-white'
                                : 'bg-white dark:bg-surface-dark-alt text-text-primary dark:text-text-dark border border-border dark:border-border-dark hover:border-accent-purple'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DiscoverPage;
