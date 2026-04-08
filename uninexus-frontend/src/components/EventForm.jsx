import { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';

const validateForm = (formData) => {
    const newErrors = {};

    // Title: required, 5-100 chars
    const title = formData.title?.trim() ?? '';
    if (!title) {
        newErrors.title = 'Title is required';
    } else if (title.length < 5) {
        newErrors.title = 'Title must be at least 5 characters';
    } else if (title.length > 100) {
        newErrors.title = 'Title must be 100 characters or fewer';
    }

    // Event date: required, must be in the future
    // if (!formData.eventDate) {
    //     newErrors.eventDate = 'Event date & time is required';
    // } else {
    //     const d = new Date(formData.eventDate);
    //     if (Number.isNaN(d.getTime())) {
    //         newErrors.eventDate = 'Enter a valid date';
    //     } else if (d <= new Date()) {
    //         newErrors.eventDate = 'Must be a future date & time';
    //     }
    // }

    if (!formData.eventDate) {
        newErrors.eventDate = 'Event date & time is required';
    } else {
        const d = new Date(formData.eventDate);
        if (Number.isNaN(d.getTime())) {
            newErrors.eventDate = 'Enter a valid date';
        } else {
            const status = (formData.status || '').toLowerCase();
            const allowPast = status === 'completed' || status === 'canceled';
            if (!allowPast && d <= new Date()) {
                newErrors.eventDate = 'Must be a future date & time';
            }
        }
    }

    // Location: required, min 3 chars
    const location = formData.location?.trim() ?? '';
    if (!location) {
        newErrors.location = 'Location is required';
    } else if (location.length < 3) {
        newErrors.location = 'Please enter a more specific location';
    }

    // Max attendees: optional, integer 1-10,000
    if (formData.maxAttendees !== '' && formData.maxAttendees !== undefined) {
        const n = Number(formData.maxAttendees);
        if (!Number.isInteger(n) || n < 1 || n > 10000) {
            newErrors.maxAttendees = 'Enter a whole number between 1 and 10,000';
        }
    }

    // Tags: optional, max 8 tags, each <=30 chars, alphanumeric/hyphens/underscores/spaces only
    if (formData.tags?.trim()) {
        const tags = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
        if (tags.length > 8) {
            newErrors.tags = 'Maximum 8 tags allowed';
        } else if (tags.some((t) => t.length > 30)) {
            newErrors.tags = 'Each tag must be 30 characters or fewer';
        } else if (tags.some((t) => /[^a-zA-Z0-9\s\-_]/.test(t))) {
            newErrors.tags = 'Tags can only contain letters, numbers, hyphens, and underscores';
        }
    }

    // Category: required selection
    if (!formData.category) {
        newErrors.category = 'Please select a category';
    }

    return newErrors;
};

const toInputDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const normalizeInitialData = (initialData) => {
    const safe = initialData && typeof initialData === 'object' ? initialData : {};
    return {
        title: safe.title || '',
        description: safe.description || '',
        eventDate: toInputDateTime(safe.eventDate),
        location: safe.location || '',
        maxAttendees: safe.maxAttendees?.toString() || '',
        tags: Array.isArray(safe.tags) ? safe.tags.join(', ') : (safe.tags || ''),
        category: safe.category || 'Other',
        isFeatured: safe.isFeatured || false,
        status: safe.status || 'upcoming',
    };
};

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const EventForm = ({ initialData, onSubmit, loading }) => {
    const [formData, setFormData] = useState(() => normalizeInitialData(initialData ?? {}));
    const [errors, setErrors] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(
        initialData?.imageUrl ? `${BACKEND}${initialData.imageUrl}` : null
    );

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const clearFieldError = (field) => {
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validateForm(formData);
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const firstKey = Object.keys(newErrors)[0];
            document.getElementById(firstKey)?.focus();
            return;
        }

        if (typeof onSubmit !== 'function') {
            console.error(new Error('EventForm onSubmit is not a function'));
            return;
        }

        try {
            // FormData — image + text fields
            const data = new FormData();
            data.append('title', formData.title.trim());
            data.append('description', formData.description.trim());
            data.append('eventDate', formData.eventDate);
            data.append('location', formData.location.trim());
            if (formData.maxAttendees) {
                data.append('maxAttendees', parseInt(formData.maxAttendees, 10));
            }
            const tagsArray = (formData.tags || '')
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
            tagsArray.forEach((tag) => data.append('tags[]', tag));
            data.append('category', formData.category);
            data.append('isFeatured', formData.isFeatured);
            data.append('status', formData.status);
            if (imageFile) {
                data.append('image', imageFile);
            }

            await onSubmit(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                id="title"
                label="Event Title"
                placeholder="e.g., Intro to React Workshop"
                value={formData.title || ''}
                error={errors.title}
                onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }));
                    clearFieldError('title');
                }}
            />
            <p className="text-xs text-right text-text-secondary dark:text-text-dark-secondary -mt-2">
                {(formData.title || '').length}/100
            </p>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                    Description
                    </label>
                    <span className="text-xs text-text-secondary dark:text-text-dark-secondary">
                        {(formData.description || '').length}/500
                    </span>
                </div>
                <textarea
                    id="description"
                    placeholder="What's the event about?"
                    value={formData.description || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    id="eventDate"
                    label="Event Date & Time"
                    type="datetime-local"
                    value={formData.eventDate || ''}
                    error={errors.eventDate}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, eventDate: e.target.value }));
                        clearFieldError('eventDate');
                    }}
                />
                <Input
                    id="location"
                    label="Location"
                    placeholder="e.g., Room 301, Main Building"
                    value={formData.location || ''}
                    error={errors.location}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, location: e.target.value }));
                        clearFieldError('location');
                    }}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    id="maxAttendees"
                    label="Max Attendees"
                    type="number"
                    min="1"
                    placeholder="e.g., 50"
                    value={formData.maxAttendees || ''}
                    error={errors.maxAttendees}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, maxAttendees: e.target.value }));
                        clearFieldError('maxAttendees');
                    }}
                />
                <Input
                    id="tags"
                    label="Tags (comma-separated)"
                    placeholder="e.g., react, workshop"
                    value={formData.tags || ''}
                    error={errors.tags}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, tags: e.target.value }));
                        clearFieldError('tags');
                    }}
                />
            </div>



            {/* Category & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-text-primary dark:text-text-dark">
                        Category
                    </label>
                    <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => {
                            setFormData((prev) => ({ ...prev, category: e.target.value }));
                            clearFieldError('category');
                        }}
                        className={`w-full px-3 py-2.5 bg-white dark:bg-surface-dark-alt border rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50 ${
                            errors.category
                                ? 'border-error focus:ring-error/50'
                                : 'border-border dark:border-border-dark'
                        }`}
                    >
                        {['Academic', 'Sports', 'Cultural', 'Workshop', 'Social', 'Career', 'Other'].map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    {errors.category && (
                        <p className="text-sm text-error mt-1">{errors.category}</p>
                    )}
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-text-primary dark:text-text-dark">
                        Status
                    </label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-white dark:bg-surface-dark-alt border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                    >
                        {['upcoming', 'ongoing', 'completed', 'cancelled'].map((status) => (
                            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Featured Event Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border dark:border-border-dark">
                <div>
                    <p className="text-sm font-medium text-text-primary dark:text-text-dark">
                        Featured Event
                    </p>
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                        Show as hero banner on the student events page
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isFeatured: !prev.isFeatured }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer flex-shrink-0
                        ${formData.isFeatured ? 'bg-accent-purple' : 'bg-border dark:bg-border-dark'}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                            ${formData.isFeatured ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                </button>
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                    Event Image <span className="text-text-secondary dark:text-text-dark-secondary font-normal">(optional)</span>
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-text-secondary dark:text-text-dark-secondary
                        file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0
                        file:text-sm file:font-medium file:bg-accent-purple/10
                        file:text-accent-purple hover:file:bg-accent-purple/20
                        file:cursor-pointer cursor-pointer"
                />
                {preview && (
                    <div className="relative mt-2">
                        <img
                            src={preview}
                            alt="Event preview"
                            className="h-40 w-full object-cover rounded-xl border border-border dark:border-border-dark"
                        />
                        <button
                            type="button"
                            onClick={() => { setImageFile(null); setPreview(null); }}
                            className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg hover:bg-black/70 cursor-pointer"
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" variant="gradient" loading={loading}>
                    {initialData?.title ? 'Update Event' : 'Create Event'}
                </Button>
            </div>
        </form>
    );
};

EventForm.defaultProps = {
    initialData: null,
    loading: false,
};

export default EventForm;
