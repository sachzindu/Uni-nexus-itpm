const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },

            imageUrl: {
            type: String,
            default: '',
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
            trim: true,
        },
        eventDate: {
            type: Date,
            required: [true, 'Event date is required'],
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
            maxlength: [200, 'Location cannot exceed 200 characters'],
        },
        maxAttendees: {
            type: Number,
            required: [true, 'Max attendees is required'],
            min: [1, 'Max attendees must be at least 1'],
        },
        attendees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            default: 'upcoming',
        },
        category: {
            type: String,
            enum: [
                'Academic',
                'Sports',
                'Cultural',
                'Workshop',
                'Social',
                'Career',
                'Other',
            ],
            default: 'Other',
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

eventSchema.virtual('isFull').get(function () {
    const attendeeCount = Array.isArray(this.attendees) ? this.attendees.length : 0;
    return attendeeCount >= this.maxAttendees;
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);