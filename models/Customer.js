const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
    customerId: {
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
    dateOfBirth: {
        type: Date,
        required: true
    },
    aadhaarNumber: {
        type: String,
        required: true,
        unique: true
    },
    panNumber: {
        type: String,
        sparse: true // Allows null/undefined while maintaining uniqueness for non-null values
    },
    nomineeName: {
        type: String,
        required: true
    },
    nomineeRelation: {
        type: String,
        required: true
    },
    nomineeContact: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    collectorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collector',
        required: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active'
    },
    totalSavings: {
        type: Number,
        default: 0
    },
    lastPaymentDate: {
        type: Date
    },
    // Soft delete fields
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { 
    timestamps: true 
});

// Hash password before saving
customerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
customerSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Add a query helper to exclude deleted customers by default
customerSchema.query.excludeDeleted = function() {
    return this.where({ 
        $or: [
            { status: { $ne: 'deleted' } },
            { status: { $exists: false } }
        ]
    });
};

module.exports = mongoose.model('Customer', customerSchema);