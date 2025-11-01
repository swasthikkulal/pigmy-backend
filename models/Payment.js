const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    collectorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector',
        required: false
    },
    amount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'online', 'withdrawal'], // ADD 'withdrawal' here
        default: 'cash'
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal'], // ADD this field for transaction type
        default: 'deposit'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'verified', 'failed'],
        default: 'pending'
    },
    receiptNumber: {
        type: String
    },
    remarks: {
        type: String
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminModel'
    },
    verifiedAt: {
        type: Date
    },
    // Add these fields for better tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'createdByModel'
    },
    createdByModel: {
        type: String,
        enum: ['Customer', 'User', 'Collector']
    },
    processedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);