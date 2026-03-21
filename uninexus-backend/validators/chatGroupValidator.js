const Joi = require('joi');

const createChatGroupSchema = Joi.object({
    name: Joi.string().trim().max(100).allow('').optional(),
    isDirectMessage: Joi.boolean().optional().default(false),
    memberIds: Joi.array()
        .items(Joi.string().hex().length(24))
        .min(1)
        .required()
        .messages({
            'any.required': 'At least one member is required',
            'array.min': 'At least one member is required',
        }),
    avatar: Joi.string().uri().allow('').optional(),
});

const updateChatGroupSchema = Joi.object({
    name: Joi.string().trim().max(100).allow(''),
    avatar: Joi.string().uri().allow('').optional(),
}).min(1);

const addMembersSchema = Joi.object({
    memberIds: Joi.array()
        .items(Joi.string().hex().length(24))
        .min(1)
        .required()
        .messages({
            'any.required': 'At least one member ID is required',
            'array.min': 'At least one member ID is required',
        }),
});

module.exports = { createChatGroupSchema, updateChatGroupSchema, addMembersSchema };
