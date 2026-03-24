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
    };
};

const EventForm = ({ initialData, onSubmit, loading }) => {
    const [formData, setFormData] = useState(() => normalizeInitialData(initialData ?? {}));
    const [errors, setErrors] = useState({});

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
            await onSubmit({
                title: (formData.title || '').trim(),
                description: (formData.description || '').trim(),
                eventDate: formData.eventDate || '',
                location: (formData.location || '').trim(),
                maxAttendees: formData.maxAttendees
                    ? parseInt(formData.maxAttendees, 10)
                    : undefined,
                tags: (formData.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
            });
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
