const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema({
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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        required: true
    },
    openingBalance: {
        type: Number,
        required: true
    },
    closingBalance: {
        type: Number,
        required: true
    },
    totalDeposits: {
        type: Number,
        default: 0
    },
    totalWithdrawals: {
        type: Number,
        default: 0
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Statement', statementSchema);