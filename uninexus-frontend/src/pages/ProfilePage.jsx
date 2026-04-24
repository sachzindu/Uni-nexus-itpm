import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, BookOpen, Calendar, Edit3, Save, X,
    Camera, ImagePlus, Trash2, Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { userAPI } from '../services/api';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import UserAvatar from '../components/ui/UserAvatar';

const departments = [
    'Computer Science', 'Engineering', 'Business', 'Arts & Design',
    'Medicine', 'Law', 'Sciences', 'Education', 'Social Sciences', 'Architecture',
];

const ProfilePage = () => {
    const { user, updateProfile, fetchMe } = useAuth();
    const toast = useToast();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        department: user?.department || '',
        year: user?.year?.toString() || '',
        bio: user?.bio || '',
    });

    const galleryInputRef = useRef(null);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [deletingPhoto, setDeletingPhoto] = useState(null);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({
                name: form.name.trim(),
                department: form.department,
                year: parseInt(form.year, 10),
                bio: form.bio.trim(),
            });
            toast.success('Profile updated!');
            setEditing(false);
        } catch (err) {
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm({
            name: user?.name || '',
            department: user?.department || '',
            year: user?.year?.toString() || '',
            bio: user?.bio || '',
        });
        setEditing(false);
    };

    // ─── Gallery Handlers ────────────────────────────────────
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_GALLERY = 5;

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Reset input so same file can be selected again
        e.target.value = '';

        const currentCount = user?.galleryPhotos?.length || 0;
        if (currentCount + files.length > MAX_GALLERY) {
            toast.error(`You can upload at most ${MAX_GALLERY - currentCount} more photo(s).`);
            return;
        }

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                toast.error(`${file.name}: Only JPEG, PNG, and WebP images are allowed.`);
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name}: Image must be smaller than 5 MB.`);
                return;
            }
        }

        setUploadingGallery(true);
        try {
            await userAPI.uploadGalleryPhotos(files);
            await fetchMe();
            toast.success('Photos uploaded!');
        } catch (err) {
            toast.error(err.message || 'Failed to upload photos');
        } finally {
            setUploadingGallery(false);
        }
    };

    const handleDeletePhoto = async (photoUrl) => {
        setDeletingPhoto(photoUrl);
        try {
            await userAPI.deleteGalleryPhoto(photoUrl);
            await fetchMe();
            toast.success('Photo deleted');
        } catch (err) {
            toast.error(err.message || 'Failed to delete photo');
        } finally {
            setDeletingPhoto(null);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Profile header */}
                <Card hover={false} className="text-center mb-6">
                    <UserAvatar user={user} size="xl" className="mx-auto mb-4 animate-pulse-glow" />
                    <h1 className="text-2xl font-extrabold text-text-primary dark:text-text-dark">
                        {user?.name}
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary">
                        {user?.email}
                    </p>
                    <div className="flex justify-center gap-2 mt-3">
                        {user?.department && (
                            <Badge variant="purple">{user.department}</Badge>
                        )}
                        {user?.year && <Badge variant="orange">Year {user.year}</Badge>}
                        <Badge variant={user?.role === 'admin' ? 'gradient' : 'default'}>
                            {user?.role || 'student'}
                        </Badge>
                    </div>
                    {user?.bio && (
                        <p className="mt-4 text-sm text-text-secondary dark:text-text-dark-secondary max-w-md mx-auto">
                            {user.bio}
                        </p>
                    )}
                </Card>

                {/* Interests */}
                <Card hover={false} className="mb-6">
                    <h3 className="text-lg font-bold text-text-primary dark:text-text-dark mb-4">
                        My Interests
                    </h3>
                    {user?.interests?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {user.interests.map((int) => (
                                <div
                                    key={int}
                                    className="px-4 py-2 rounded-2xl bg-white dark:bg-surface-dark
                    border border-border dark:border-border-dark
                    text-sm font-medium text-text-primary dark:text-text-dark
                    card-shadow card-hover"
                                >
                                    {int}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            No interests selected yet.
                        </p>
                    )}
                </Card>

                {/* My Photos */}
                <Card hover={false} className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-text-primary dark:text-text-dark">
                            My Photos
                        </h3>
                        {(user?.galleryPhotos?.length || 0) > 0 && (user?.galleryPhotos?.length || 0) < MAX_GALLERY && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => galleryInputRef.current?.click()}
                                loading={uploadingGallery}
                            >
                                <Plus size={14} />
                                Add More
                            </Button>
                        )}
                    </div>

                    <input
                        ref={galleryInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleGalleryUpload}
                        className="hidden"
                        id="gallery-photo-input"
                    />

                    {(user?.galleryPhotos?.length || 0) > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {user.galleryPhotos.map((photo) => (
                                <div
                                    key={photo}
                                    className="relative group aspect-square rounded-2xl overflow-hidden
                                        border border-border dark:border-border-dark card-shadow"
                                >
                                    <img
                                        src={photo}
                                        alt="Gallery"
                                        className="w-full h-full object-cover transition-transform duration-300
                                            group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30
                                        transition-all duration-300" />
                                    <button
                                        onClick={() => handleDeletePhoto(photo)}
                                        disabled={deletingPhoto === photo}
                                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60
                                            flex items-center justify-center text-white
                                            opacity-0 group-hover:opacity-100 transition-opacity
                                            hover:bg-red-500 cursor-pointer disabled:opacity-50"
                                        title="Delete photo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-alt dark:bg-surface-dark
                                flex items-center justify-center">
                                <Camera size={28} className="text-text-secondary/40" />
                            </div>
                            <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-4">
                                Share up to 5 photos on your profile.
                            </p>
                            <Button
                                variant="gradient"
                                size="sm"
                                onClick={() => galleryInputRef.current?.click()}
                                loading={uploadingGallery}
                            >
                                <ImagePlus size={16} />
                                Upload Photos
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Edit Profile */}
                <Card hover={false}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-text-primary dark:text-text-dark">
                            Profile Details
                        </h3>
                        {!editing ? (
                            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                                <Edit3 size={14} />
                                Edit
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={handleCancel}>
                                    <X size={14} />
                                    Cancel
                                </Button>
                                <Button variant="gradient" size="sm" onClick={handleSave} loading={saving}>
                                    <Save size={14} />
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Full Name"
                            icon={User}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            disabled={!editing}
                        />

                        <div>
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark mb-1.5">
                                Department
                            </label>
                            <select
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                disabled={!editing}
                                className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark
                  border border-border dark:border-border-dark rounded-xl
                  text-text-primary dark:text-text-dark
                  focus:outline-none focus:ring-2 focus:ring-accent-purple/50
                  disabled:opacity-60"
                            >
                                <option value="">Select department</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark mb-1.5">
                                Year of Study
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((y) => (
                                    <button
                                        key={y}
                                        type="button"
                                        onClick={() => editing && setForm({ ...form, year: y.toString() })}
                                        disabled={!editing}
                                        className={`py-2 rounded-xl font-medium text-sm transition-all ${!editing ? 'cursor-default' : 'cursor-pointer'
                                            } ${form.year === y.toString()
                                                ? 'gradient-bg text-white'
                                                : 'bg-surface-alt dark:bg-surface-dark border border-border dark:border-border-dark text-text-primary dark:text-text-dark'
                                            } disabled:opacity-60`}
                                    >
                                        Year {y}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                                Bio
                            </label>
                            <textarea
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                disabled={!editing}
                                rows={3}
                                placeholder="Tell people about yourself..."
                                className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark
                  border border-border dark:border-border-dark rounded-xl
                  text-text-primary dark:text-text-dark
                  focus:outline-none focus:ring-2 focus:ring-accent-purple/50
                  resize-none disabled:opacity-60"
                            />
                        </div>
                    </div>
                </Card>

                {/* Activity summary */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    {[
                        { label: 'Groups', value: user?.groups?.length || 0, icon: BookOpen },
                        { label: 'Events', value: user?.events?.length || 0, icon: Calendar },
                        { label: 'Posts', value: user?.posts?.length || 0, icon: Edit3 },
                    ].map(({ label, value, icon: Icon }) => (
                        <Card key={label} hover={false} className="text-center !p-4">
                            <Icon size={20} className="mx-auto mb-1 text-accent-purple" />
                            <p className="text-xl font-bold text-text-primary dark:text-text-dark">{value}</p>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary">{label}</p>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;
