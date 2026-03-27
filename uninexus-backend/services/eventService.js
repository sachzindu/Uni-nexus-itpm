const mongoose = require('mongoose');
const createError = require('http-errors');
const Event = require('../models/Event');
const logger = require('../utils/logger');

/**
 * Create a new event.
 */
const createEvent = async (userId, eventData) => {
    const event = await Event.create({
        ...eventData,
        organizer: userId,
    });

    logger.info(`Event created: "${event.title}" by user ${userId}`);
    return event;
};

/**
 * Get all events with optional filtering.
 */
const getEvents = async (query = {}) => {
    const filter = {};

    if (query.search) {
        filter.$or = [
            { title: { $regex: query.search, $options: 'i' } },
            { description: { $regex: query.search, $options: 'i' } },
            { location: { $regex: query.search, $options: 'i' } },
        ];
    }

    if (query.status) {
        filter.status = query.status;
    }

    if (query.tag) {
        filter.tags = { $in: [query.tag.toLowerCase().trim()] };
    }

    if (query.upcoming === 'true') {
        filter.eventDate = { $gte: new Date() };
        filter.status = { $in: ['upcoming', 'ongoing'] };
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
        Event.find(filter)
            .populate('organizer', 'name email')
            .populate('group', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ eventDate: 1 }),
        Event.countDocuments(filter),
    ]);

    return {
        events,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};

/**
 * Get a single event by ID.
 */
const getEventById = async (eventId) => {
    const event = await Event.findById(eventId)
        .populate('organizer', 'name email')
        .populate('group', 'name')
        .populate('attendees', 'name email avatar');

    if (!event) throw createError(404, 'Event not found.');
    return event;
};

/**
 * Update an event. Only the organizer or platform admin can update.
 */
const updateEvent = async (eventId, userId, userRole, updateData) => {
    const event = await Event.findById(eventId);
    if (!event) throw createError(404, 'Event not found.');

    if (!event.organizer.equals(userId) && userRole !== 'admin') {
        throw createError(403, 'Only the organizer or platform admin can update this event.');
    }

    Object.assign(event, updateData);
    await event.save();

    return event;
};

/**
 * Delete an event. Only the organizer or platform admin can delete.
 */
const deleteEvent = async (eventId, userId, userRole) => {
    const event = await Event.findById(eventId);
    if (!event) throw createError(404, 'Event not found.');

    if (!event.organizer.equals(userId) && userRole !== 'admin') {
        throw createError(403, 'Only the organizer or platform admin can delete this event.');
    }

    await Event.findByIdAndDelete(eventId);
    logger.info(`Event deleted: "${event.title}" by user ${userId}`);
};

/**
 * Register for an event using MongoDB transactions to prevent overbooking.
 * Also prevents registration for past events.
 */
const registerForEvent = async (eventId, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const event = await Event.findById(eventId).session(session);
        if (!event) {
            throw createError(404, 'Event not found.');
        }

        // Prevent registration for past events
        if (new Date(event.eventDate) < new Date()) {
            throw createError(400, 'Cannot register for an event that has already passed.');
        }

        // Check if event is cancelled
        if (event.status === 'cancelled') {
            throw createError(400, 'Cannot register for a cancelled event.');
        }

        if (event.status === 'completed') {
            throw createError(400, 'Cannot register for a completed event.');
        }

        // Check if already registered
        if (event.attendees.some((a) => a.equals(userId))) {
            throw createError(409, 'You are already registered for this event.');
        }

        // Check capacity (overbooking prevention)
        if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
            throw createError(409, 'This event is fully booked. No spots available.');
        }

        // Atomically add attendee within transaction
        event.attendees.push(userId);
        await event.save({ session });

        await session.commitTransaction();
        logger.info(`User ${userId} registered for event "${event.title}"`);

        return event;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Unregister from an event.
 */
const unregisterFromEvent = async (eventId, userId) => {
    const event = await Event.findById(eventId);
    if (!event) throw createError(404, 'Event not found.');

    if (!event.attendees.some((a) => a.equals(userId))) {
        return event;
    }

    event.attendees = event.attendees.filter((a) => !a.equals(userId));
    await event.save();

    logger.info(`User ${userId} unregistered from event "${event.title}"`);
    return event;
};

/**
 * Get attendees of an event.
 */
const getAttendees = async (eventId) => {
    const event = await Event.findById(eventId)
        .populate('attendees', 'name email avatar department year');

    if (!event) throw createError(404, 'Event not found.');
    return event.attendees;
};

/**
 * Get dashboard statistics for events.
 */
const getDashboardStats = async () => {
    const now = new Date();

    const [totalEvents, upcomingEvents, completedEvents, totalRegistrations] =
        await Promise.all([
            Event.countDocuments(),
            Event.countDocuments({
                eventDate: { $gte: now },
                status: { $in: ['upcoming', 'ongoing'] },
            }),
            Event.countDocuments({ status: 'completed' }),
            Event.aggregate([
                { $project: { attendeeCount: { $size: '$attendees' } } },
                { $group: { _id: null, total: { $sum: '$attendeeCount' } } },
            ]),
        ]);

    return {
        totalEvents,
        upcomingEvents,
        completedEvents,
        cancelledEvents: await Event.countDocuments({ status: 'cancelled' }),
        totalRegistrations: totalRegistrations[0]?.total || 0,
    };
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
