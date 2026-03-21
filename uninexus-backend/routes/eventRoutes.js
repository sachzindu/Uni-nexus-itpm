const express = require('express');
const router = express.Router();
const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    registerForEvent,
    unregisterFromEvent,
    getAttendees,
    getDashboardStats,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validate');
const { createEventSchema, updateEventSchema } = require('../validators/eventValidator');

// All routes require authentication
router.use(protect);

// Dashboard stats (must be above /:id to avoid route conflict)
router.get('/dashboard', checkRole('admin'), getDashboardStats);

router.route('/')
    .get(getEvents)
    .post(validate(createEventSchema), createEvent);

router.route('/:id')
    .get(getEventById)
    .put(validate(updateEventSchema), updateEvent)
    .delete(deleteEvent);

router.post('/:id/register', registerForEvent);
router.post('/:id/unregister', unregisterFromEvent);
router.get('/:id/attendees', getAttendees);

module.exports = router;
