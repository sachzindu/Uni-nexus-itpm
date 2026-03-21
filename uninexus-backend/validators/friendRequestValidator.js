const Joi = require('joi');

const sendRequestSchema = Joi.object({
    toUserId: Joi.string().hex().length(24).required().messages({
        'string.hex': 'toUserId must be a valid ObjectId',
        'string.length': 'toUserId must be a valid ObjectId',
        'any.required': 'toUserId is required',
    }),
});

const respondToRequestSchema = Joi.object({
    status: Joi.string().valid('accepted', 'rejected').required().messages({
        'any.only': 'Status must be either "accepted" or "rejected"',
        'any.required': 'Status is required',
    }),
});

module.exports = { sendRequestSchema, respondToRequestSchema };
