// models/Feedback.js
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    type: {
        type: String,
        enum: ['complaint', 'suggestion', 'inquiry', 'general'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector'
    },
    response: {
        message: {
            type: String,
            trim: true
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin' // Changed from 'User' to 'Admin'
        },
        respondedAt: {
            type: Date
        }
    },
    userAgent: String,
    ipAddress: String
}, { 
    timestamps: true 
});

// Auto-set priority based on rating
feedbackSchema.pre('save', function(next) {
    if (this.rating <= 2) {
        this.priority = 'high';
    } else if (this.rating === 3) {
        this.priority = 'medium';
    } else {
        this.priority = 'low';
    }
    next();
});

module.exports = mongoose.model('Feedback', feedbackSchema);