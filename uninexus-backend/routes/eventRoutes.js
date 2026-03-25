const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // ← LINE 1: add කරන්න
const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    registerEvent,
    unregisterEvent,
    getEventAttendees,
    getEventDashboardStats,
} = require('../controllers/eventController');

router
    .route('/')
    .get(getEvents)
    .post(upload.single('image'), createEvent); // ← LINE 2: upload add කළා

router.get('/dashboard', getEventDashboardStats);

router
    .route('/:id')
    .get(getEventById)
    .put(upload.single('image'), updateEvent)   // ← LINE 3: upload add කළා
    .delete(deleteEvent);

router.get('/:id/attendees', getEventAttendees);
router.post('/:id/register', registerEvent);
router.post('/:id/unregister', unregisterEvent);

module.exports = router;