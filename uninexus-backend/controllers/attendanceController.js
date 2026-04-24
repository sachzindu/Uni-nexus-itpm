const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /attendance/:eventId
exports.getAttendance = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid event ID' });
        }
        const event = await Event.findById(eventId).populate('attendees', 'studentIdNumber faculty');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        const students = (event.attendees || [])
            .map(u => ({
                studentId: u.studentIdNumber || 'N/A',
                faculty: u.faculty || 'N/A',
            }));
        return res.status(200).json(students);
    } catch (error) {
        next(error);
    }
};
