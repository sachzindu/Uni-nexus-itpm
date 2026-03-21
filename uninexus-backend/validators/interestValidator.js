const Joi = require('joi');

const createInterestSchema = Joi.object({
    category: Joi.string().trim().min(2).max(100).required().messages({
        'any.required': 'Category name is required',
        'string.min': 'Category name must be at least 2 characters',
    }),
    subInterests: Joi.array()
        .items(Joi.string().trim().max(100))
        .min(1)
        .required()
        .messages({
            'any.required': 'At least one sub-interest is required',
            'array.min': 'At least one sub-interest is required',
        }),
});

const updateInterestSchema = Joi.object({
    category: Joi.string().trim().min(2).max(100),
    subInterests: Joi.array()
        .items(Joi.string().trim().max(100))
        .min(1),
}).min(1).messages({
    'object.min': 'At least one field must be provided for update',
});

module.exports = { createInterestSchema, updateInterestSchema };
