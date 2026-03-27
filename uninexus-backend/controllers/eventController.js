// Get the featured event (upcoming/ongoing)
const getFeaturedEvent = async (req, res, next) => {
    try {
        const event = await Event.findOne({
            isFeatured: true,
            status: { $in: ['upcoming', 'ongoing'] },
        }).sort({ eventDate: 1 });

        return res.status(200).json({
            success: true,
            data: event || null,
        });
    } catch (error) {
        next(error);
    }
};
const mongoose = require('mongoose');
const Event = require('../models/Event');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const resolveUserId = (req) => req.user?._id || req.body?.userId;

const createEvent = async (req, res, next) => {
    try {
        console.log('[EVENT] createEvent payload:', req.body);

        const eventData = { ...req.body };
        if (req.file) {
            eventData.imageUrl = `/uploads/${req.file.filename}`;
        }

        // If this event is to be featured, remove featured from all others
        if (eventData.isFeatured === true || eventData.isFeatured === 'true') {
            await Event.updateMany({ isFeatured: true }, { isFeatured: false });
            eventData.isFeatured = true;
        } else {
            eventData.isFeatured = false;
        }

        const event = await Event.create(eventData);

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event,
        });
    } catch (error) {
        next(error);
    }
};

const getEvents = async (req, res, next) => {
    try {
        const { status, search } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (req.query.category) filter.category = req.query.category;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
            ];
        }

        console.log('[EVENT] getEvents filter:', filter);
        const events = await Event.find(filter).sort({ eventDate: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: events,
            count: events.length,
        });
    } catch (error) {
        next(error);
    }
};

const getEventById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const event = await Event.findById(id).populate('attendees', 'name email');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        return res.status(200).json({
            success: true,
            data: event,
        });
    } catch (error) {
        next(error);
    }
};

const updateEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        console.log('[EVENT] updateEvent id:', id);

        const updateData = { ...req.body };
        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        // If this event is to be featured, remove featured from all others
        if (updateData.isFeatured === true || updateData.isFeatured === 'true') {
            await Event.updateMany({ isFeatured: true, _id: { $ne: id } }, { isFeatured: false });
            updateData.isFeatured = true;
        } else {
            updateData.isFeatured = false;
        }

        const event = await Event.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: event,
        });
    } catch (error) {
        next(error);
    }
};

const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        // Check if the event to be deleted is featured
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        const wasFeatured = event.isFeatured;
        await Event.findByIdAndDelete(id);

        // If it was featured, no event is featured now (handled by above logic)

        return res.status(200).json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

const registerEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { userId, studentIdNumber, faculty } = req.body || {};

        console.log('Register payload:', req.body);

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }
        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Valid userId is required' });
        }

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!Array.isArray(event.attendees)) {
            event.attendees = [];
        }

        // Fetch user and validate or update studentIdNumber and faculty
        const UserModel = require('../models/User');
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let userUpdated = false;
        if (studentIdNumber && user.studentIdNumber !== studentIdNumber) {
            user.studentIdNumber = studentIdNumber;
            userUpdated = true;
        }
        if (faculty && user.faculty !== faculty) {
            user.faculty = faculty;
            userUpdated = true;
        }
        if (userUpdated) {
            await user.save();
        }

        // After update, check again
        if (!user.studentIdNumber || !user.faculty) {
            return res.status(400).json({ success: false, message: 'User must have both studentIdNumber and faculty to register for events.' });
        }

        if (event.status === 'cancelled' || event.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Registration is closed for this event' });
        }

        const normalizedUserId = String(userId);
        const isAlreadyRegistered = event.attendees.some(
            (attendeeId) => String(attendeeId) === normalizedUserId
        );
        if (isAlreadyRegistered) {
            return res.status(409).json({ success: false, message: 'Already registered' });
        }

        if (event.attendees.length >= event.maxAttendees) {
            return res.status(409).json({ success: false, message: 'Event is full' });
        }

        event.attendees.push(userId);
        await event.save();

        return res.status(200).json({
            success: true,
            message: 'Registered successfully',
            data: event,
        });
    } catch (error) {
        next(error);
    }
};

const unregisterEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = resolveUserId(req);

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: 'Valid userId is required' });
        }

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        event.attendees = event.attendees.filter((attendeeId) => !attendeeId.equals(userId));
        await event.save();

        return res.status(200).json({
            success: true,
            message: 'Unregistered successfully',
            data: event,
        });
    } catch (error) {
        next(error);
    }
};

const getEventAttendees = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }

        const event = await Event.findById(id).populate('attendees', 'name email avatar department year');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        return res.status(200).json({
            success: true,
            data: {
                attendees: Array.isArray(event.attendees) ? event.attendees : [],
            },
        });
    } catch (error) {
        next(error);
    }
};

const getEventDashboardStats = async (req, res, next) => {
    try {
        const now = new Date();
        const [totalEvents, upcomingEvents, completedEvents, cancelledEvents, totalRegistrations] =
            await Promise.all([
                Event.countDocuments(),
                Event.countDocuments({
                    eventDate: { $gte: now },
                    status: { $in: ['upcoming', 'ongoing'] },
                }),
                Event.countDocuments({ status: 'completed' }),
                Event.countDocuments({ status: 'cancelled' }),
                Event.aggregate([
                    { $project: { attendeeCount: { $size: { $ifNull: ['$attendees', []] } } } },
                    { $group: { _id: null, total: { $sum: '$attendeeCount' } } },
                ]),
            ]);

        return res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalEvents,
                    upcomingEvents,
                    completedEvents,
                    cancelledEvents,
                    totalRegistrations: totalRegistrations[0]?.total || 0,
                },
            },
        });
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
    registerEvent,
    unregisterEvent,
    getEventAttendees,
    getEventDashboardStats,
    getFeaturedEvent,
};