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
        required: true,
        unique: true
    },
    password: {
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
    },
    lastLogin: {
        type: Date
    }
}, { timestamps: true });

// Auto-set password to phone number before saving
collectorSchema.pre('save', function(next) {
    // Always set password to phone number if not set
    if (!this.password) {
        this.password = this.phone;
    }
    next();
});

// For login - compare plain phone number (no hashing)
collectorSchema.methods.matchPassword = function(enteredPassword) {
    return enteredPassword === this.phone;
};

module.exports = mongoose.model('Collector', collectorSchema);