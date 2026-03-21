const Joi = require('joi');

const createEventSchema = Joi.object({
    title: Joi.string().trim().min(2).max(200).required().messages({
        'any.required': 'Event title is required',
    }),
    description: Joi.string().max(2000).allow(''),
    group: Joi.string().hex().length(24).allow(null, ''), // ObjectId format
    eventDate: Joi.date().iso().greater('now').required().messages({
        'any.required': 'Event date is required',
        'date.greater': 'Event date must be in the future',
    }),
    location: Joi.string().trim().max(200).allow(''),
    maxAttendees: Joi.number().integer().min(1),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(50)).max(20),
});

const updateEventSchema = Joi.object({
    title: Joi.string().trim().min(2).max(200),
    description: Joi.string().max(2000).allow(''),
    eventDate: Joi.date().iso(),
    location: Joi.string().trim().max(200).allow(''),
    maxAttendees: Joi.number().integer().min(1),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(50)).max(20),
    status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled'),
}).min(1);

module.exports = { createEventSchema, updateEventSchema };
