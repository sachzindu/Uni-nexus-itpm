const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
            maxlength: [100, 'Category name cannot exceed 100 characters'],
        },
        subInterests: [
            {
                type: String,
                trim: true,
                maxlength: [100, 'Sub-interest name cannot exceed 100 characters'],
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Pre-save hook: deduplicate and normalize sub-interests
interestSchema.pre('save', function () {
    if (this.isModified('subInterests')) {
        this.subInterests = [...new Set(this.subInterests.map((s) => s.trim()))];
    }
});

// Normalize category to title case on save
interestSchema.pre('save', function () {
    if (this.isModified('category')) {
        this.category = this.category.trim();
    }
});

// Virtual: sub-interest count
interestSchema.virtual('subInterestCount').get(function () {
    return this.subInterests.length;
});

// Ensure virtuals are serialized
interestSchema.set('toJSON', { virtuals: true });
interestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Interest', interestSchema);
