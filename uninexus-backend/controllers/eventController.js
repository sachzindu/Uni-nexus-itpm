const eventService = require('../services/eventService');

/**
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Private
 */
const createEvent = async (req, res, next) => {
    try {
        const event = await eventService.createEvent(req.user._id, req.body);
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: { event },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all events
 * @route   GET /api/events
 * @access  Private
 */
const getEvents = async (req, res, next) => {
    try {
        const result = await eventService.getEvents(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single event
 * @route   GET /api/events/:id
 * @access  Private
 */
const getEventById = async (req, res, next) => {
    try {
        const event = await eventService.getEventById(req.params.id);
        res.status(200).json({ success: true, data: { event } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update an event
 * @route   PUT /api/events/:id
 * @access  Private (Organizer / Admin)
 */
const updateEvent = async (req, res, next) => {
    try {
        const event = await eventService.updateEvent(
            req.params.id,
            req.user._id,
            req.user.role,
            req.body
        );
        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: { event },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete an event
 * @route   DELETE /api/events/:id
 * @access  Private (Organizer / Admin)
 */
const deleteEvent = async (req, res, next) => {
    try {
        await eventService.deleteEvent(req.params.id, req.user._id, req.user.role);
        res.status(200).json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Register for an event
 * @route   POST /api/events/:id/register
 * @access  Private
 */
const registerForEvent = async (req, res, next) => {
    try {
        const event = await eventService.registerForEvent(req.params.id, req.user._id);
        res.status(200).json({
            success: true,
            message: 'Registered for event successfully',
            data: { event },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Unregister from an event
 * @route   POST /api/events/:id/unregister
 * @access  Private
 */
const unregisterFromEvent = async (req, res, next) => {
    try {
        const event = await eventService.unregisterFromEvent(req.params.id, req.user._id);
        res.status(200).json({
            success: true,
            message: 'Unregistered from event successfully',
            data: { event },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get event attendees
 * @route   GET /api/events/:id/attendees
 * @access  Private
 */
const getAttendees = async (req, res, next) => {
    try {
        const attendees = await eventService.getAttendees(req.params.id);
        res.status(200).json({ success: true, data: { attendees } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get event dashboard statistics
 * @route   GET /api/events/dashboard
 * @access  Private (Admin)
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await eventService.getDashboardStats();
        res.status(200).json({ success: true, data: { stats } });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    registerForEvent,
    unregisterFromEvent,
    getAttendees,
    getDashboardStats,
};
