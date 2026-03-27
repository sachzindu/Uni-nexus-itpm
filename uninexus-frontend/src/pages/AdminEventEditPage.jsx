import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { eventAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import Loader from '../components/ui/Loader';
import Card from '../components/ui/Card';
import EventForm from '../components/EventForm';

const getEventFromResponse = (res) => res?.data?.event || res?.data || res?.event || null;

const AdminEventEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            try {
                const res = await eventAPI.getById(id);
                const fetchedEvent = getEventFromResponse(res);
                if (!fetchedEvent) {
                    toast.error('Event not found');
                    navigate('/admin/events');
                    return;
                }
                setEvent(fetchedEvent);
            } catch (err) {
                toast.error(err.message || 'Failed to load event');
                navigate('/admin/events');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id, navigate, toast]);

    const handleUpdate = async (payload) => {
        setSaving(true);
        try {
            await eventAPI.update(id, payload);
            toast.success('Event updated successfully');
            navigate('/admin/events');
        } catch (err) {
            toast.error(err.message || 'Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate('/admin/events')}
                className="flex items-center gap-2 text-text-secondary dark:text-text-dark-secondary
                hover:text-text-primary dark:hover:text-text-dark mb-6 cursor-pointer"
            >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">Back to Events</span>
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card hover={false}>
                    <h1 className="text-2xl font-extrabold text-text-primary dark:text-text-dark mb-2">
                        Edit <span className="gradient-text">Event</span>
                    </h1>
                    <p className="text-text-secondary dark:text-text-dark-secondary mb-6">
                        Update event information and save your changes.
                    </p>
                    {event ? (
                        <EventForm
                            initialData={event}
                            onSubmit={handleUpdate}
                            loading={saving}
                        />
                    ) : (
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            Event data is unavailable.
                        </p>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

export default AdminEventEditPage;
