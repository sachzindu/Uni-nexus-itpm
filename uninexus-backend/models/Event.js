const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            default: null, // Optional association
        },
        eventDate: {
            type: Date,
            required: [true, 'Event date is required'],
        },
        location: {
            type: String,
            trim: true,
        },
        maxAttendees: {
            type: Number,
            min: [1, 'Max attendees must be at least 1'],
        },
        attendees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        tags: [
            {
                type: String,
                set: (v) => v.toLowerCase().trim(),
            },
        ],
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            default: 'upcoming',
        },
    },
    {
        timestamps: true,
    }
);

// Virtual: available spots remaining
eventSchema.virtual('availableSpots').get(function () {
    if (!this.maxAttendees) return null; // Unlimited if not set
    return Math.max(0, this.maxAttendees - this.attendees.length);
});

// Virtual: check if event is full
eventSchema.virtual('isFull').get(function () {
    if (!this.maxAttendees) return false;
    return this.attendees.length >= this.maxAttendees;
});

// Virtual: check if event has passed
eventSchema.virtual('isPast').get(function () {
    return new Date(this.eventDate) < new Date();
});

// Ensure virtuals are serialized
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// Pre-save hook: normalize tags
eventSchema.pre('save', function () {
    if (this.isModified('tags')) {
        this.tags = [...new Set(this.tags.map((t) => t.toLowerCase().trim()))];
    }
});

module.exports = mongoose.model('Event', eventSchema);
