import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    ShieldCheck,
    GraduationCap,
    Layers,
    Plus,
    Pencil,
    Trash2,
    X,
    ChevronDown,
    ChevronRight,
    Tag,
    LogOut,
    Search,
    Calendar,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { interestAPI, userAPI } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

const AdminDashboardPage = () => {
    const { user, logout } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    // Stats state
    const [stats, setStats] = useState({ totalUsers: 0, totalStudents: 0, totalAdmins: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    // Interest state
    const [interests, setInterests] = useState([]);
    const [interestsLoading, setInterestsLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
    const [editingInterest, setEditingInterest] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ category: '', subInterests: '' });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        fetchStats();
        fetchInterests();
    }, []);

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const res = await userAPI.getAdminStats();
            setStats(res.data.stats);
        } catch {
            toast.error('Failed to load statistics');
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchInterests = async () => {
        try {
            setInterestsLoading(true);
            const res = await interestAPI.getAll();
            setInterests(res.data.interests);
        } catch {
            toast.error('Failed to load interests');
        } finally {
            setInterestsLoading(false);
        }
    };

    // Modal handlers
    const openCreateModal = () => {
        setModalMode('create');
        setCategoryForm({ category: '', subInterests: '' });
        setEditingInterest(null);
        setFormErrors({});
        setShowModal(true);
    };

    const openEditModal = (interest) => {
        setModalMode('edit');
        setCategoryForm({
            category: interest.category,
            subInterests: interest.subInterests.join(', '),
        });
        setEditingInterest(interest);
        setFormErrors({});
        setShowModal(true);
    };

    const validateForm = () => {
        const errs = {};
        if (!categoryForm.category.trim()) errs.category = 'Category name is required';
        if (!categoryForm.subInterests.trim()) errs.subInterests = 'At least one sub-interest is required';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSaving(true);
        try {
            const subInterests = categoryForm.subInterests
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);

            const payload = {
                category: categoryForm.category.trim(),
                subInterests,
            };

            if (modalMode === 'create') {
                await interestAPI.create(payload);
                toast.success('Interest category created!');
            } else {
                await interestAPI.update(editingInterest._id, payload);
                toast.success('Interest category updated!');
            }

            setShowModal(false);
            fetchInterests();
        } catch (err) {
            toast.error(err.message || 'Failed to save interest');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        try {
            await interestAPI.delete(deleteTarget._id);
            toast.success(`"${deleteTarget.category}" deleted successfully`);
            setDeleteTarget(null);
            fetchInterests();
        } catch (err) {
            toast.error(err.message || 'Failed to delete interest');
        } finally {
            setDeleting(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    // Filter interests by search
    const filteredInterests = interests.filter((interest) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            interest.category.toLowerCase().includes(q) ||
            interest.subInterests.some((s) => s.toLowerCase().includes(q))
        );
    });

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark">
            {/* Top Nav */}
            <header className="sticky top-0 z-40 glass border-b border-border dark:border-border-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                            <ShieldCheck size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-text-primary dark:text-text-dark">
                                Uni<span className="gradient-text">Nexus</span> Admin
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-text-secondary dark:text-text-dark-secondary hidden sm:block">
                            {user?.name}
                        </span>
                        <Button variant="secondary" size="sm" onClick={() => navigate('/admin/events')}>
                            <Calendar size={16} />
                            Events
                        </Button>
                        <Button variant="gradient" size="sm" onClick={() => navigate('/admin/events?create=true')}>
                            <Plus size={16} />
                            Create Event
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOut size={16} />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                            Admin Dashboard 🛡️
                        </h1>
                        <p className="text-white/80 text-lg">
                            Manage interests, monitor user growth, and keep UniNexus thriving.
                        </p>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        {
                            label: 'Total Users',
                            value: stats.totalUsers,
                            icon: Users,
                            color: 'text-accent-purple',
                            bg: 'bg-accent-purple/10',
                        },
                        {
                            label: 'Students',
                            value: stats.totalStudents,
                            icon: GraduationCap,
                            color: 'text-accent-orange',
                            bg: 'bg-accent-orange/10',
                        },
                        {
                            label: 'Admins',
                            value: stats.totalAdmins,
                            icon: ShieldCheck,
                            color: 'text-success',
                            bg: 'bg-success/10',
                        },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <Card key={label} hover={false}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                                    <Icon size={24} className={color} />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-text-primary dark:text-text-dark">
                                        {statsLoading ? '—' : value}
                                    </p>
                                    <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                                        {label}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Interest Management */}
                <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Layers size={22} className="text-accent-purple" />
                            <h2 className="text-xl font-bold text-text-primary dark:text-text-dark">
                                Interest Categories
                            </h2>
                            <Badge variant="purple" className="ml-2">
                                {interests.length}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary dark:text-text-dark-secondary"
                                />
                                <input
                                    type="text"
                                    placeholder="Search interests..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl text-sm text-text-primary dark:text-text-dark placeholder-text-secondary dark:placeholder-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple transition-all"
                                />
                            </div>
                            <Button variant="gradient" size="sm" onClick={openCreateModal}>
                                <Plus size={16} />
                                Add Category
                            </Button>
                        </div>
                    </div>

                    {interestsLoading ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white dark:bg-surface-dark-alt rounded-3xl p-6 animate-pulse"
                                >
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                </div>
                            ))}
                        </div>
                    ) : filteredInterests.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredInterests.map((interest) => (
                                <motion.div
                                    key={interest._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-surface-dark-alt rounded-3xl card-shadow overflow-hidden"
                                >
                                    {/* Category Header */}
                                    <div
                                        className="flex items-center justify-between p-5 cursor-pointer hover:bg-surface-alt dark:hover:bg-surface-dark transition-colors"
                                        onClick={() =>
                                            setExpandedCategory(
                                                expandedCategory === interest._id ? null : interest._id
                                            )
                                        }
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedCategory === interest._id ? (
                                                <ChevronDown size={18} className="text-accent-purple" />
                                            ) : (
                                                <ChevronRight size={18} className="text-text-secondary dark:text-text-dark-secondary" />
                                            )}
                                            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                                                <Tag size={16} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-text-primary dark:text-text-dark">
                                                    {interest.category}
                                                </h3>
                                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                                    {interest.subInterests.length} sub-interest{interest.subInterests.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(interest);
                                                }}
                                            >
                                                <Pencil size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget(interest);
                                                }}
                                            >
                                                <Trash2 size={14} className="text-error" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Sub-interests (expandable) */}
                                    <AnimatePresence>
                                        {expandedCategory === interest._id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 pt-2 border-t border-border dark:border-border-dark">
                                                    <div className="flex flex-wrap gap-2">
                                                        {interest.subInterests.map((sub) => (
                                                            <Badge
                                                                key={sub}
                                                                variant="purple"
                                                                className="text-sm px-3 py-1.5"
                                                            >
                                                                {sub}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <Card hover={false} className="text-center py-16">
                            <Layers size={48} className="mx-auto mb-4 text-accent-purple/30" />
                            <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
                                {searchQuery
                                    ? 'No interests match your search'
                                    : 'No interest categories yet. Create your first one!'}
                            </p>
                            {!searchQuery && (
                                <Button variant="gradient" size="sm" onClick={openCreateModal}>
                                    <Plus size={16} />
                                    Add Category
                                </Button>
                            )}
                        </Card>
                    )}
                </div>
            </main>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalMode === 'create' ? 'New Interest Category' : 'Edit Interest Category'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Category Name"
                        icon={Layers}
                        placeholder="e.g. Technology, Sports, Music"
                        value={categoryForm.category}
                        onChange={(e) => setCategoryForm({ ...categoryForm, category: e.target.value })}
                        error={formErrors.category}
                    />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                            Sub-Interests
                        </label>
                        <textarea
                            placeholder="Enter sub-interests separated by commas, e.g. Web Development, AI, Cybersecurity"
                            value={categoryForm.subInterests}
                            onChange={(e) =>
                                setCategoryForm({ ...categoryForm, subInterests: e.target.value })
                            }
                            rows={4}
                            className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark placeholder-text-secondary dark:placeholder-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple transition-all resize-none"
                        />
                        {formErrors.subInterests && (
                            <p className="text-sm text-error mt-1">{formErrors.subInterests}</p>
                        )}
                        {categoryForm.subInterests && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {categoryForm.subInterests
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                    .map((s) => (
                                        <Badge key={s} variant="purple" className="text-xs">
                                            {s}
                                        </Badge>
                                    ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="gradient"
                            className="flex-1"
                            loading={saving}
                        >
                            {modalMode === 'create' ? 'Create Category' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete Interest Category"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-text-secondary dark:text-text-dark-secondary">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-text-primary dark:text-text-dark">
                            &quot;{deleteTarget?.category}&quot;
                        </span>
                        ? This will remove all {deleteTarget?.subInterests?.length || 0} sub-interests. This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={handleDelete}
                            loading={deleting}
                        >
                            <Trash2 size={16} />
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminDashboardPage;
