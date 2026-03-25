import { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nextErrors = {};
        if (!formData.title.trim()) nextErrors.title = 'Event title is required';
        if (!formData.eventDate) nextErrors.eventDate = 'Event date and time is required';

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        if (typeof onSubmit !== 'function') {
            console.error(new Error('EventForm onSubmit is not a function'));
            return;
        }

        try {
            // FormData හදන්න — image + text fields එකට
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
                label="Event Title"
                placeholder="e.g., Intro to React Workshop"
                value={formData.title || ''}
                error={errors.title}
                onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }));
                    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
            />
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary dark:text-text-dark">
                    Description
                </label>
                <textarea
                    placeholder="What's the event about?"
                    value={formData.description || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-accent-purple/50 resize-none"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Event Date & Time"
                    type="datetime-local"
                    value={formData.eventDate || ''}
                    error={errors.eventDate}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, eventDate: e.target.value }));
                        if (errors.eventDate) setErrors((prev) => ({ ...prev, eventDate: '' }));
                    }}
                />
                <Input
                    label="Location"
                    placeholder="e.g., Room 301, Main Building"
                    value={formData.location || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Max Attendees (optional)"
                    type="number"
                    min="1"
                    placeholder="e.g., 50"
                    value={formData.maxAttendees || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxAttendees: e.target.value }))}
                />
                <Input
                    label="Tags (comma-separated)"
                    placeholder="e.g., react, workshop"
                    value={formData.tags || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                />
            </div>

            {/* Category */}
            <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary dark:text-text-dark">
                    Category
                </label>
                <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white dark:bg-surface-dark-alt border border-border
                        dark:border-border-dark rounded-xl text-text-primary dark:text-text-dark
                        focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                >
                    {['Academic', 'Sports', 'Cultural', 'Workshop', 'Social', 'Career', 'Other'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
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