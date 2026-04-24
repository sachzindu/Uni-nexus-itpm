const Joi = require('joi');

const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    department: Joi.string().trim().max(100).allow(''),
    year: Joi.number().integer().min(1).max(6),
    bio: Joi.string().max(500).allow(''),
    interests: Joi.array().items(Joi.string().trim().lowercase().max(50)).max(30),
    selectedInterests: Joi.array().items(
        Joi.object({
            category: Joi.string().hex().length(24).required().messages({
                'string.hex': 'Category must be a valid ObjectId',
                'string.length': 'Category must be a valid ObjectId',
            }),
            subInterests: Joi.array()
                .items(Joi.string().trim().max(100))
                .min(1)
                .required()
                .messages({
                    'array.min': 'At least one sub-interest must be selected per category',
                }),
        })
    ),
    avatar: Joi.string().uri().allow(''),
    profilePhotoUrl: Joi.string().allow(''),
}).min(1).messages({
    'object.min': 'At least one field must be provided for update',
});

module.exports = { updateProfileSchema };
