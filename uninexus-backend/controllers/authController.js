const authService = require('../services/authService');

// Cookie options for JWT token
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
    try {
        const { user, token } = await authService.signup(req.body);

        res
            .status(201)
            .cookie('token', token, cookieOptions)
            .json({
                success: true,
                message: 'User registered successfully',
                data: { user, token },
            });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login(email, password);

        res
            .status(200)
            .cookie('token', token, cookieOptions)
            .json({
                success: true,
                message: 'Login successful',
                data: { user, token },
            });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout user (clear cookie)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
    res
        .status(200)
        .cookie('token', '', { ...cookieOptions, maxAge: 0 })
        .json({
            success: true,
            message: 'Logged out successfully',
        });
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user._id);
        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { signup, login, logout, getMe };
