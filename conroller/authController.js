// controllers/authController.js - UPDATED
const Admin = require("../models/Admin")
const jwt = require('jsonwebtoken');

// Register new admin
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required: name, email, password" 
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: "Admin already exists with this email" 
            });
        }

        // Create admin - password will be hashed by pre-save hook
        const admin = await Admin.create({ 
            name, 
            email, 
            password // Don't hash here, let the model handle it
        });

        // Generate token using model method
        const token = admin.getSignedJwtToken();

        res.status(201).json({ 
            success: true, 
            message: 'Admin registered successfully',
            token: token,
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (err) {
        console.error('Registration error:', err);
        
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "Admin with this email already exists" 
            });
        }
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(error => error.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Validation Error',
                errors: messages 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Login admin - UPDATED
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt for:', email);

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find admin with password field
        const admin = await Admin.findOne({ email }).select('+password');
        
        if (!admin) {
            console.log('❌ Admin not found:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password using model method
        const isMatch = await admin.matchPassword(password);
        
        if (!isMatch) {
            console.log('❌ Password mismatch for:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check if admin is active
        if (!admin.isActive) {
            console.log('❌ Admin account inactive:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Account is deactivated. Please contact administrator.' 
            });
        }

        // Generate token using model method
        const token = admin.getSignedJwtToken();

        console.log('✅ Login successful for:', email);
        console.log('🔑 Token generated');

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role || 'admin',
                isActive: admin.isActive
            }
        });

    } catch (err) {
        console.error('💥 Login error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

module.exports = { registerAdmin, loginAdmin };