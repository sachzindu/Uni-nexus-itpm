const Joi = require('joi');

const createGroupSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
        'any.required': 'Group name is required',
    }),
    description: Joi.string().max(1000).allow(''),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(50)).max(20),
    memberIds: Joi.array().items(Joi.string().trim()).max(50),
});

const updateGroupSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().max(1000).allow(''),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(50)).max(20),
}).min(1);

const handleJoinRequestSchema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required().messages({
        'any.required': 'Status is required',
        'any.only': 'Status must be either approved or rejected',
    }),
});

module.exports = { createGroupSchema, updateGroupSchema, handleJoinRequestSchema };
