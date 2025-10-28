const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    type: {
        type: String,
        enum: ['complaint', 'suggestion', 'inquiry'],
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector'
    },
    response: {
        type: String
    },
    respondedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);