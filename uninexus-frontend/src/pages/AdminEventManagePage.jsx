import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { eventAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import Loader from '../components/ui/Loader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const getEventFromResponse = (res) => res?.data?.event || res?.data || res?.event || null;

const normalizeAttendees = (attendees) => {
    if (!Array.isArray(attendees)) return [];
    return attendees.map((att, index) => {
        if (typeof att === 'string') {
            return {
                _id: att,
                name: `Attendee ${index + 1}`,
                email: '',
            };
        }
        return {
            _id: att._id || `attendee-${index}`,
            name: att.name || 'Unknown user',
            email: att.email || '',
        };
    });
};

const AdminEventManagePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [event, setEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [attendanceState, setAttendanceState] = useState({});
    const [loading, setLoading] = useState(true);

    // Registered Students (Attendees) feature
    const [showRegisteredStudents, setShowRegisteredStudents] = useState(false);
    const [registeredStudents, setRegisteredStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentsError, setStudentsError] = useState(null);
    // Handler for fetching registered students (studentId, faculty)
    const handleShowRegisteredStudents = async () => {
        if (showRegisteredStudents) {
            setShowRegisteredStudents(false);
            return;
        }
        setShowRegisteredStudents(true);
        setStudentsLoading(true);
        setStudentsError(null);
        try {
            const data = await eventAPI.getAttendance(id);
            setRegisteredStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            setStudentsError(err.message || 'Failed to fetch registered students');
            setRegisteredStudents([]);
        } finally {
            setStudentsLoading(false);
        }
    };

    useEffect(() => {
        const fetchEventDetails = async () => {
            setLoading(true);
            try {
                const [eventRes, attendeesRes] = await Promise.all([
                    eventAPI.getById(id),
                    eventAPI.getAttendees(id).catch(() => null),
                ]);

                const fetchedEvent = getEventFromResponse(eventRes);
                if (!fetchedEvent) {
                    toast.error('Event not found');
                    navigate('/admin/events');
                    return;
                }

                const attendeeList = attendeesRes?.data?.attendees || fetchedEvent.attendees || [];
                const normalizedAttendees = normalizeAttendees(attendeeList);

                setEvent(fetchedEvent);
                setAttendees(normalizedAttendees);
                setAttendanceState(
                    normalizedAttendees.reduce((acc, attendee) => {
                        acc[attendee._id] = false;
                        return acc;
                    }, {})
                );
            } catch (err) {
                toast.error(err.message || 'Failed to load event management data');
                navigate('/admin/events');
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [id, navigate, toast]);

    const toggleAttendance = (attendeeId) => {
        setAttendanceState((prev) => ({
            ...prev,
            [attendeeId]: !prev[attendeeId],
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (!event) {
        return null;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                className="space-y-6"
            >
                <Card hover={false}>
                    <h1 className="text-2xl font-extrabold text-text-primary dark:text-text-dark mb-4">
                        Event <span className="gradient-text">Management</span>
                    </h1>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-1">
                                Title
                            </p>
                            <p className="font-semibold text-text-primary dark:text-text-dark">
                                {event.title || 'Untitled event'}
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <Calendar size={16} className="text-accent-purple mt-0.5" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-1">
                                    Date
                                </p>
                                <p className="font-semibold text-text-primary dark:text-text-dark">
                                    {event.eventDate
                                        ? new Date(event.eventDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                        : 'TBA'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin size={16} className="text-accent-orange mt-0.5" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-1">
                                    Location
                                </p>
                                <p className="font-semibold text-text-primary dark:text-text-dark">
                                    {event.location || 'TBA'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <Users size={16} className="text-success mt-0.5" />
                            <div>
                                <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-1">
                                    Total Attendees
                                </p>
                                <p className="font-semibold text-text-primary dark:text-text-dark">
                                    {attendees.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card hover={false}>
                    <h2 className="text-lg font-bold text-text-primary dark:text-text-dark mb-4">
                        Attendees
                    </h2>
                    <button
                        className="mb-4 px-4 py-2 rounded bg-accent-purple text-white font-semibold hover:bg-accent-purple/90 focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                        onClick={handleShowRegisteredStudents}
                        type="button"
                    >
                        {showRegisteredStudents ? 'Hide Registered Students' : 'Show Registered Students'}
                    </button>
                    {showRegisteredStudents && (
                        <div className="mb-4">
                            {studentsLoading ? (
                                <div className="py-4 text-center text-text-secondary dark:text-text-dark-secondary">Loading...</div>
                            ) : studentsError ? (
                                <div className="py-4 text-center text-error">{studentsError}</div>
                            ) : registeredStudents.length === 0 ? (
                                <div className="py-4 text-center text-text-secondary dark:text-text-dark-secondary">No registered students</div>
                            ) : (
                                <div className="space-y-2">
                                    {registeredStudents.map((student, idx) => (
                                        <div
                                            key={student.studentId || idx}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-surface-alt dark:bg-surface-dark border border-border dark:border-border-dark"
                                        >
                                            <span className="font-mono text-base text-text-primary dark:text-text-dark">
                                                Student ID: <span className="font-semibold">{student.studentId}</span>
                                            </span>
                                            <span className="text-base text-text-secondary dark:text-text-dark-secondary">
                                                Faculty: <span className="font-semibold">{student.faculty}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {/* Existing attendee list (do not change) */}
                    {attendees.length > 0 ? (
                        <div className="space-y-3">
                            {attendees.map((attendee) => (
                                <div
                                    key={attendee._id}
                                    className="flex items-center justify-between p-3 rounded-xl
                                    bg-surface-alt dark:bg-surface-dark"
                                >
                                    <div>
                                        <p className="font-medium text-text-primary dark:text-text-dark">
                                            {attendee.name}
                                        </p>
                                        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                            {attendee.email || 'Email not available'}
                                        </p>
                                    </div>
                                    <Badge variant="purple">Registered</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            No users have registered yet.
                        </p>
                    )}
                </Card>

                <Card hover={false}>
                    <h2 className="text-lg font-bold text-text-primary dark:text-text-dark mb-4">
                        Attendance Toggle
                    </h2>
                    {attendees.length > 0 ? (
                        <div className="space-y-3">
                            {attendees.map((attendee) => (
                                <label
                                    key={attendee._id}
                                    className="flex items-center justify-between p-3 rounded-xl
                                    bg-surface-alt dark:bg-surface-dark cursor-pointer"
                                >
                                    <span className="font-medium text-text-primary dark:text-text-dark">
                                        {attendee.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-text-secondary dark:text-text-dark-secondary">
                                            {attendanceState[attendee._id] ? 'Present' : 'Absent'}
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={!!attendanceState[attendee._id]}
                                            onChange={() => toggleAttendance(attendee._id)}
                                            className="h-4 w-4 rounded border-border dark:border-border-dark
                                            text-accent-purple focus:ring-accent-purple/50"
                                        />
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
                            Add attendees first to track attendance.
                        </p>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

export default AdminEventManagePage;
