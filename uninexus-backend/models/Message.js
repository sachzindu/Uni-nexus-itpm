const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender is required'],
        },
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            default: null,
        },
        chatGroup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatGroup',
            default: null,
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            maxlength: [5000, 'Message cannot exceed 5000 characters'],
        },
        type: {
            type: String,
            enum: ['text', 'system'],
            default: 'text',
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Custom validator: exactly one of group or chatGroup must be set.
// Mongoose v9 may not provide the `next` callback reliably for this hook,
// so we throw to reject validation instead of calling `next(...)`.
messageSchema.pre('validate', function () {
    const hasGroup = this.group != null;
    const hasChatGroup = this.chatGroup != null;

    if (!hasGroup && !hasChatGroup) {
        throw new Error('A message must belong to either a group or a chat group.');
    }
    if (hasGroup && hasChatGroup) {
        throw new Error('A message cannot belong to both a group and a chat group.');
    }
});

// Index for efficient message retrieval by group or chatGroup
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ chatGroup: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
