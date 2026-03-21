const express = require('express');
const router = express.Router();
const {
    createChatGroup,
    getChatGroupsForUser,
    getChatGroupById,
    updateChatGroup,
    addMembers,
    removeMember,
    leaveChatGroup,
} = require('../controllers/chatGroupController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
    createChatGroupSchema,
    updateChatGroupSchema,
    addMembersSchema,
} = require('../validators/chatGroupValidator');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getChatGroupsForUser)
    .post(validate(createChatGroupSchema), createChatGroup);

router.route('/:id')
    .get(getChatGroupById)
    .put(validate(updateChatGroupSchema), updateChatGroup);

router.post('/:id/members', validate(addMembersSchema), addMembers);
router.delete('/:id/members/:memberId', removeMember);
router.post('/:id/leave', leaveChatGroup);

module.exports = router;
