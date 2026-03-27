const express = require('express');
const router = express.Router();
const {
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    requestJoin,
    handleJoinRequest,
    leaveGroup,
    getMembers,
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
    createGroupSchema,
    updateGroupSchema,
    handleJoinRequestSchema,
} = require('../validators/groupValidator');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getGroups)
    .post(validate(createGroupSchema), createGroup);

router.route('/:id')
    .get(getGroupById)
    .put(validate(updateGroupSchema), updateGroup)
    .delete(deleteGroup);

router.post('/:id/join', requestJoin);
router.put('/:id/join-requests/:requestId', validate(handleJoinRequestSchema), handleJoinRequest);
router.post('/:id/leave', leaveGroup);
router.get('/:id/members', getMembers);

// Remove a member (admin only)
router.delete('/:groupId/members/:memberId', require('../middleware/authMiddleware').protect, require('../controllers/groupController').removeMember);

module.exports = router;
