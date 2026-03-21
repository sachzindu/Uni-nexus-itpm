const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Exclude from queries by default
        },
        role: {
            type: String,
            enum: ['student', 'admin'],
            default: 'student',
        },
        department: {
            type: String,
            trim: true,
        },
        year: {
            type: Number,
            min: 1,
            max: 6,
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters'],
        },
        interests: [
            {
                type: String,
                set: (v) => v.toLowerCase().trim(), // Normalize tags
            },
        ],
        selectedInterests: [
            {
                category: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Interest',
                },
                subInterests: [
                    {
                        type: String,
                        trim: true,
                    },
                ],
            },
        ],
        avatar: {
            type: String,
            default: '',
        },
        groups: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',

        }],

        chatGroups: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatGroup',

        }],

        posts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',

        }],

        events: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',

        }],
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook: hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Pre-save hook: deduplicate and normalize interests
userSchema.pre('save', function () {
    if (this.isModified('interests')) {
        this.interests = [...new Set(this.interests.map((i) => i.toLowerCase().trim()))];
    }
});

// Pre-save hook: sync flat interests array from selectedInterests
userSchema.pre('save', function () {
    if (this.isModified('selectedInterests') && this.selectedInterests.length > 0) {
        const allSubInterests = this.selectedInterests.flatMap((si) => si.subInterests);
        this.interests = [...new Set(allSubInterests.map((i) => i.toLowerCase().trim()))];
    }
});

/**
 * Compare a candidate password with the stored hashed password.
 * @param {string} candidatePassword - Plain text password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
