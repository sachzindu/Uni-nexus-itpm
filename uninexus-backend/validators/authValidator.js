const Joi = require('joi');

const signupSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required',
    }),
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).max(128).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required',
    }),
    role: Joi.string().valid('student', 'admin').default('student'),
    department: Joi.string().trim().max(100).allow(''),
    year: Joi.number().integer().min(1).max(6),
    faculty: Joi.string().trim().max(100).required().messages({
        'any.required': 'Faculty is required',
    }),
    studentIdNumber: Joi.string()
        .alphanum()
        .length(10)
        .required()
        .messages({
            'string.length': 'Student ID Number must be exactly 10 characters',
            'string.alphanum': 'Student ID Number must contain only letters and numbers',
            'any.required': 'Student ID Number is required',
        }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required',
    }),
});

module.exports = { signupSchema, loginSchema };
