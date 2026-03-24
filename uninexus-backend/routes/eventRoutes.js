const express = require('express');
const router = express.Router();
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
    .post(createEvent);

router.get('/dashboard', getEventDashboardStats);

router
    .route('/:id')
    .get(getEventById)
    .put(updateEvent)
    .delete(deleteEvent);

router.get('/:id/attendees', getEventAttendees);
router.post('/:id/register', registerEvent);
router.post('/:id/unregister', unregisterEvent);

module.exports = router;
