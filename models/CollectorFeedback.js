// models/CollectorFeedback.js
const mongoose = require('mongoose');

const collectorFeedbackSchema = new mongoose.Schema({
    // Collector who submitted the feedback
    submitted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector',
        required: true
    },
    
    // Collector being reviewed (if any)
    about_collector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector'
    },
    
    // Feedback content
    message: {
        type: String,
        required: true
    },
    
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    
    // Feedback category
    category: {
        type: String,
        enum: ['general', 'colleague', 'system', 'suggestion', 'complaint'],
        default: 'general'
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'action_taken', 'resolved'],
        default: 'pending'
    },
    
    // Admin notes
    admin_notes: {
        type: String
    },
    
    created_at: {
        type: Date,
        default: Date.now
    },
    
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update the updated_at timestamp before saving
collectorFeedbackSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('CollectorFeedback', collectorFeedbackSchema);