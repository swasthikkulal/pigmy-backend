const mongoose = require('mongoose');

const collectorSchema = new mongoose.Schema({
    collectorId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    area: {
        type: String,
        required: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    totalCustomers: {
        type: Number,
        default: 0
    },
    totalCollections: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Collector', collectorSchema);