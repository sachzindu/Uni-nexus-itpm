const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Group name is required'],
            unique: true,
            trim: true,
            maxlength: [100, 'Group name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        tags: [
            {
                type: String,
                set: (v) => v.toLowerCase().trim(),
            },
        ],
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        joinRequests: [joinRequestSchema],
        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook: normalize tags
groupSchema.pre('save', function () {
    if (this.isModified('tags')) {
        this.tags = [...new Set(this.tags.map((t) => t.toLowerCase().trim()))];
    }
});

// Virtual: member count
groupSchema.virtual('memberCount').get(function () {
    return this.members.length;
});

// Ensure virtuals are serialized
groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Group', groupSchema);
