const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Add bcrypt import

// Generate JWT Token for customers
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Customer login attempt:', { email, password: password ? '***' : 'empty' });

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find customer
    const customer = await Customer.findOne({
      email: email.toLowerCase()
    })
      .select('+password') // Include password field
      .populate('collectorId', 'name phone area');

    console.log('📋 Found customer:', customer ? {
      id: customer._id,
      email: customer.email,
      customerId: customer.customerId,
      status: customer.status,
      hasPassword: !!customer.password
    } : 'No customer found');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (customer.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // ✅ FIX: Use matchPassword instead of comparePassword
    console.log('🔑 Checking password...');
    const isPasswordMatch = await customer.matchPassword(password);
    console.log('Password match:', isPasswordMatch);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await Customer.updateOne(
      { _id: customer._id },
      { lastLogin: new Date() }
    );

    const token = generateToken(customer._id);
    console.log(token);

    console.log('✅ Customer login successful for:', customer.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      data: {
        _id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        collector: customer.collectorId
      }
    });

  } catch (error) {
    console.error('❌ Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current customer profile
// @route   GET /api/auth/customer/me
// @access  Private (Customer)
const getMe = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer._id)
      .select('-password')
      .populate('collectorId', 'name phone area');

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error getting customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Change customer password
// @route   PUT /api/auth/customer/change-password
// @access  Private (Customer)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const customer = await Customer.findById(req.customer._id).select('+password');

    // Check current password
    const isMatch = await customer.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update to new password
    customer.password = newPassword;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  loginCustomer,
  getMe,
  changePassword
};