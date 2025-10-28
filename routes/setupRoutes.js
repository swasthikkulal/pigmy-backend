// routes/setupRoutes.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Create initial admin (run once)
router.post('/setup-admin', async (req, res) => {
    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@pigmybank.com' });
        
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists'
            });
        }

        // Create new admin
        const admin = new Admin({
            name: 'System Administrator',
            email: 'admin@pigmybank.com',
            password: 'password', // Will be hashed by pre-save hook
            role: 'admin',
            isActive: true
        });

        await admin.save();

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting up admin',
            error: error.message
        });
    }
});

module.exports = router;