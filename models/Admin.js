// models/Admin.js - UPDATED
const mongoose = require("mongoose")
const bcrypt = require('bcryptjs');

const adminSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        default: 'admin',
        enum: ['admin', 'superadmin']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
adminSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
adminSchema.methods.getSignedJwtToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { id: this._id }, 
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '30d' }
    );
};

module.exports = mongoose.model("Admin", adminSchema);