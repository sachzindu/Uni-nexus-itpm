const mongoose = require('mongoose');

const chatGroupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            maxlength: [100, 'Chat group name cannot exceed 100 characters'],
        },
        isDirectMessage: {
            type: Boolean,
            default: false,
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],

        group: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Group',
            },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
        lastMessageAt: {
            type: Date,
            default: null,
        },
        avatar: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Index for finding all chat groups a user belongs to
chatGroupSchema.index({ members: 1 });
chatGroupSchema.index({ lastMessageAt: -1 });

// Virtual: member count
chatGroupSchema.virtual('memberCount').get(function () {
    return this.members.length;
});

// Pre-save: validate DM constraints
chatGroupSchema.pre('save', function () {
    if (this.isDirectMessage && this.members.length > 2) {
        throw new Error('Direct messages can only have 2 members.');
    }
});

// Ensure virtuals are serialized
chatGroupSchema.set('toJSON', { virtuals: true });
chatGroupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ChatGroup', chatGroupSchema);
