const Joi = require('joi');

const createPostSchema = Joi.object({
    content: Joi.string().trim().min(1).max(5000).required().messages({
        'any.required': 'Post content is required',
        'string.empty': 'Post content cannot be empty',
    }),
    image: Joi.string().uri().allow('').optional(),
});

const updatePostSchema = Joi.object({
    content: Joi.string().trim().min(1).max(5000),
    image: Joi.string().uri().allow('').optional(),
}).min(1);

const addCommentSchema = Joi.object({
    content: Joi.string().trim().min(1).max(2000).required().messages({
        'any.required': 'Comment content is required',
        'string.empty': 'Comment cannot be empty',
    }),
});

module.exports = { createPostSchema, updatePostSchema, addCommentSchema };
