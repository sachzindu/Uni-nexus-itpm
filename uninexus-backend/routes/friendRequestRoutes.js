const express = require('express');
const router = express.Router();
const {
    sendRequest,
    getReceivedRequests,
    respondToRequest,
    getRequestStatus,
    getFriends,
} = require('../controllers/friendRequestController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
    sendRequestSchema,
    respondToRequestSchema,
} = require('../validators/friendRequestValidator');

// All routes require authentication
router.use(protect);

router.post('/', validate(sendRequestSchema), sendRequest);
router.get('/received', getReceivedRequests);
router.get('/friends', getFriends);
router.get('/status/:userId', getRequestStatus);
router.put('/:id', validate(respondToRequestSchema), respondToRequest);

module.exports = router;
