const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt")

// Generate JWT Token


// Register new admin (optional setup route)
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation: Check if all required fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required: name, email, password" 
            });
        }

        // Check if admin already exists with this email
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: "Admin already exists with this email" 
            });
        }

        // Hash password
        const hashPassword = await bcrypt.hash(password, 10);
        
        // Create admin - no need to call save() separately when using create()
        const admin = await Admin.create({ 
            name, 
            email, 
            password: hashPassword 
        });

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(201).json({ 
            success: true, 
            message: 'Admin registered successfully',
            data: adminResponse
        });

    } catch (err) {
        console.error('Registration error:', err);
        
        // Handle duplicate key errors
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "Admin with this email already exists" 
            });
        }
        
        // Handle validation errors
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
// Login admin
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).json({ success: false, message: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) return res.status(400).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign({ id: admin._id, email: admin.email }, "hello", { expiresIn: "1h" });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                username: admin.username,
                email: admin.email,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { registerAdmin, loginAdmin };
