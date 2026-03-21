const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Comment author is required'],
        },
        content: {
            type: String,
            required: [true, 'Comment content is required'],
            maxlength: [2000, 'Comment cannot exceed 2000 characters'],
        },
    },
    {
        timestamps: true,
        _id: true,
    }
);

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Author is required'],
        },
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: [true, 'Group is required'],
        },
        content: {
            type: String,
            required: [true, 'Post content is required'],
            maxlength: [5000, 'Post content cannot exceed 5000 characters'],
        },
        image: {
            type: String,
            default: '',
        },
        upvotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        upvoteCount: {
            type: Number,
            default: 0,
        },
        downvotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        downvoteCount: {
            type: Number,
            default: 0,
        },
        comments: [commentSchema],
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
postSchema.index({ group: 1, createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ group: 1, upvoteCount: -1 });

// Virtual: commentCount
postSchema.virtual('commentCount').get(function () {
    return this.comments ? this.comments.length : 0;
});

// Virtual: voteScore (upvotes - downvotes)
postSchema.virtual('voteScore').get(function () {
    return (this.upvoteCount || 0) - (this.downvoteCount || 0);
});

// Ensure virtuals are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
